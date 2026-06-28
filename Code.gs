/**
 * ECOSYSTEM RECOGNITION PLATFORM ENGINE
 * Core Control Router for Live Warehouses & Test Sandboxes
 */

const GLOBAL_SYSTEM_CONFIG = {
  // 🌍 GLOBAL CONFIGURATION ANCHOR: CORE DATA SYSTEM
  CORE_HUB_ID: "1j2fhizA1XH2YudzhIvniePsx4d5Z3nJ4jSGToTyi0DY",
  VAULT_ROOT_FOLDER_ID: "1jlXeUs7s4QnGvMrVGZ3jEZwvud2Fv9Aq",
  SPOKE_EVALUATIONS_ID: "1F19I7RI9IY3sokg12fTl7_fY8U-0ZAll9EcAhYiHeho", 
  SPOKE_ATTENDANCE_ID: "1u-Iy_y9XXtdYHwc2Up0vMmyjKmvpctuOcDqge3-ONPo",
  SPOKE_FINANCIALS_ID: "1YtHbck7YncY19MDMz1QNa94LqGWj3e5CWzyZXhTRY50",

  // 🌍 GLOBAL CONFIGURATION ANCHOR: DEMO DATA SYSTEM
  DEMO_CORE_HUB_ID: "1KM5kOApWdKikRCiSCPGb8ldwpF3nbSvNQEVW0AltZig",
  DEMO_SPOKE_EVALUATIONS_ID: "1qJgZl0Z9iYGFnKfYska1c0eFNzCIIfvTveoZt029yVM",
  DEMO_SPOKE_ATTENDANCE_ID: "1eny4OoNqnne1cORYhDFF4IGQOnSCn9gkae5LczFa7Pg",
  DEMO_SPOKE_FINANCIALS_ID: "1rXnrfDVHrZH1NSfWwrTSRdpDatAS09RQP4CvCrUA-qs",

  // 🌍 GLOBAL CONFIGURATION ANCHOR: IDENTITY & ACCESS MANAGEMENT SYSTEM
  CONFIG_IAM_MASTER_ID: "1cj1oEw09E0C3J1Ar3qZ12Md_IhEkGBziJOpmMkfoAtg",

  GLOBAL_TIMEZONE: "Asia/Kolkata"
}; 

function doGet(e) {
  var appModule = (e && e.parameter && e.parameter.app) || "eval";
  var fileName = "App_Performance_Engine";
  
  if (appModule === "attendance") fileName = "App_Attendance_System";
  if (appModule === "billing")    fileName = "App_Financial_Dashboard";
  
  return HtmlService.createTemplateFromFile(fileName).evaluate()
      .setTitle('Kemp Management Suite Engine')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
}

function getPerformanceEngineContext(isDemoMode) {
  try {
    var userEmail = Session.getActiveUser().getEmail();
    var hasValidEmail = (userEmail && userEmail.trim() !== "");
    
    var targetHubId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_CORE_HUB_ID : GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID;
    if (!targetHubId) throw new Error("Target Master Hub ID mapping key is unconfigured.");
    
    var hubSS = SpreadsheetApp.openById(targetHubId);
    
    var staffValues = hubSS.getSheetByName("Staff_Registry").getDataRange().getValues();
    var facilityValues = hubSS.getSheetByName("Facilities_Matrix").getDataRange().getValues();
    var batchValues = hubSS.getSheetByName("Batches_Registry").getDataRange().getValues();
    var rosterValues = hubSS.getSheetByName("Academy_Roster").getDataRange().getValues();
    
    var masterPayload = {
      coaches: parseColumnToFilteredArray(staffValues, "Email_Address"),
      facilities: parseSheetToObjects(facilityValues),
      batches: parseSheetToObjects(batchValues),
      players: parseSheetToObjects(rosterValues),
      
      currentUserEmailTrace: userEmail,
      isAdmin: (userEmail.toLowerCase() === "samirkamerkar@kempfc.com"),
      isIdentityWarm: hasValidEmail,
      isHealthyPayload: true,
      environmentModeActive: isDemoMode ? "DEMO_SANDBOX" : "LIVE_PRODUCTION"
    };
    
    if (hasValidEmail && masterPayload.coaches.indexOf(userEmail) === -1) {
      masterPayload.coaches.unshift(userEmail);
    }
    
    return JSON.parse(JSON.stringify(masterPayload));

  } catch (globalServerCrash) {
    return {
      coaches: ["samirkamerkar@kempfc.com"],
      facilities: [], batches: [], players: [],
      currentUserEmailTrace: "LIMIT_RESTRICTION_ERROR",
      isAdmin: true,
      isIdentityWarm: false,
      isHealthyPayload: false,
      serverErrorMessage: globalServerCrash.toString()
    };
  }
}

/************** Autheintication strategy switch 7th June 2026 
 * Removing the serverside identity verification, in favor of simple client side IAM module
function getIdentityVerificationPacket() {
  var activeUserEmail = Session.getActiveUser().getEmail();
  var isTokenWarm = (activeUserEmail && activeUserEmail.trim() !== "");
  var webAppUrl = ScriptApp.getService().getUrl();
  
  // ⚡ HARDENED RUNTIME MODIFICATION: Deflect platform exceptions via localized try/catch block
  var nativeAuthStatus = "NOT_REQUIRED";
  var nativeAuthUrl = webAppUrl; // Initialize the deployment endpoint as the standard fallback route

  try {
    var authInfo = ScriptApp.getAuthorizationInfo(ScriptApp.AuthMode.FULL);
    nativeAuthStatus = authInfo.getAuthorizationStatus().toString(); // Returns "REQUIRED" or "NOT_REQUIRED"
    var checkUrl = authInfo.getAuthorizationUrl();
    if (checkUrl) nativeAuthUrl = checkUrl;
  } catch (authProbeError) {
    // Catch platform exception cleanly when triggered by an completely unauthenticated consumer browser context
    nativeAuthStatus = "REQUIRED";
    // Force direct fallback route lock to clear container masking on the subsequent popup handshake execution thread
    nativeAuthUrl = webAppUrl;
  }


  var verificationResult = {
    currentUserEmail: activeUserEmail,
    isIdentityWarm: isTokenWarm,
    isRegisteredStaffMatch: false,
    scriptWebAppUrl: webAppUrl,
    googleAuthStatus: nativeAuthStatus,
    googleAuthUrl: nativeAuthUrl
  };
  
  if (isTokenWarm) {
    var isSystemAdmin = (activeUserEmail.toLowerCase() === "samirkamerkar@kempfc.com");
    
    try {
      var hubSS = SpreadsheetApp.openById(GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID);
      var staffSheet = hubSS.getSheetByName("Staff_Registry");
      var staffValues = staffSheet.getDataRange().getValues();
      
      var emailIdx = staffValues[0].indexOf("Email_Address");
      if (emailIdx !== -1) {
        for (var r = 1; r < staffValues.length; r++) {
          var entry = staffValues[r][emailIdx] ? staffValues[r][emailIdx].toString().trim().toLowerCase() : "";
          if (entry === activeUserEmail.toLowerCase()) {
            verificationResult.isRegisteredStaffMatch = true;
            break;
          }
        }
      }
    } catch (sheetReadError) {
      verificationResult.isRegisteredStaffMatch = false;
    }
    
    if (isSystemAdmin) {
      verificationResult.isRegisteredStaffMatch = true;
    }
  }
  
  return verificationResult;
}
*/

function provisionNewEvaluationTab(newTabName, isDemoMode) {
  try {
    var targetWarehouseId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_EVALUATIONS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_EVALUATIONS_ID;
    var ss = SpreadsheetApp.openById(targetWarehouseId);
    
    if (ss.getSheetByName(newTabName)) {
      return { success: false, error: "A session tab named '" + newTabName + "' already exists." };
    }
    
    var newSheet = ss.insertSheet(newTabName);
    var systemHeaders = [
      "Evaluation_ID", "Student_ID", "Student_Name", "Batch_ID", "Center_ID", 
      "Technical_Score", "Tactical_Score", "Physical_Score", "Psychological_Score", 
      "Attendance_Status", "Coaching_Notes", "Evaluation_Date", "Logged_Coach_Email", "Timestamp"
    ];
    
    newSheet.getRange(1, 1, 1, systemHeaders.length).setValues([systemHeaders]);
    newSheet.getRange(1, 1, 1, systemHeaders.length).setFontWeight("bold").setBackground("#f1f5f9");
    
    return { success: true, message: "Successfully created tab '" + newTabName + "'." };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function streamEvaluationToSpoke(playerData, selectedSessionTab, txId, isDemoMode) {
  try {
    var targetSpokeId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_EVALUATIONS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_EVALUATIONS_ID;
    var ss = SpreadsheetApp.openById(targetSpokeId);
    var sheet = ss.getSheetByName(selectedSessionTab);
    
    if (!sheet) {
      return { success: false, error: "Target session tab not found.", transactionId: txId };
    }
    
    var coachEmail = Session.getActiveUser().getEmail() || playerData["Logged_Coach_Email"];
    playerData["Logged_Coach_Email"] = coachEmail;
    
    var currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var rowValues = currentHeaders.map(function(header) {
      return playerData[header] !== undefined ? playerData[header] : "";
    });
    
    sheet.appendRow(rowValues);
    return { success: true, transactionId: txId };
  } catch (error) {
    return { success: false, error: error.toString(), transactionId: txId };
  }
}

function getActiveEvaluationSessions(isDemoMode) {
  var targetWarehouseId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_EVALUATIONS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_EVALUATIONS_ID;
  return SpreadsheetApp.openById(targetWarehouseId).getSheets().map(function(sh) { return sh.getName(); });
}

function parseSheetToObjects(matrix) {
  var headers = matrix[0]; var list = [];
  for (var r = 1; r < matrix.length; r++) {
    var row = matrix[r]; var obj = {};
    for (var c = 0; c < headers.length; c++) { obj[headers[c]] = row[c]; }
    list.push(obj);
  }
  return list;
}

function parseColumnToFilteredArray(matrix, headerName) {
  var headers = matrix[0]; var colIdx = headers.indexOf(headerName);
  if (colIdx === -1) return [];
  var list = [];
  for (var r = 1; r < matrix.length; r++) { if (matrix[r][colIdx]) list.push(matrix[r][colIdx]); }
  return list;
}

// 🛡️ REUSABLE ECOSYSTEM IDENTITY & ACCESS MANAGEMENT BACKEND SERVICES

/**
 * Scans the centralized database ledger and extracts profile addresses authorized for the active script scope
 */
function fetchAuthorizedApplicationProfiles(appScopeKey) {
  // CONFIGURATION LINK: Lock explicitly onto your unified user sheet vault container
  const vaultId = GLOBAL_SYSTEM_CONFIG.CONFIG_IAM_MASTER_ID; 
  const sheet = SpreadsheetApp.openById(vaultId).getSheetByName("IAM_Registry");
  const data = sheet.getDataRange().getValues();
  
  let verifiedProfileListing = [];
  
  // Start tracking at index 1 to skip row headers cleanly
  for (let i = 1; i < data.length; i++) {
    var emailCell   = String(data[i][0]).toLowerCase().trim();
    var statusCell  = String(data[i][1]).trim();
    var passwordCell = String(data[i][2]).trim();
    var approvedApps = String(data[i][3]).toLowerCase().trim();

    // 🧪 ADD THESE TWO DIAGNOSTIC LOG LINES RIGHT HERE:
    Logger.log("Row " + (i+1) + " Read Check -> Email: '" + emailCell + "', Status: '" + statusCell + "', Apps: '" + approvedApps + "'");
    Logger.log("Match Evaluation -> Status Match: " + (statusCell === "Active") + " | Scope Match: " + (approvedApps.indexOf(appScopeKey) !== -1));
    
    // Ensure the row profile is structurally active and contains authorization matching the app code token
    if (statusCell === "Active" && approvedApps.indexOf(appScopeKey) !== -1) {
      verifiedProfileListing.push({
        email: emailCell,
        hasPassword: (passwordCell !== "") // Tells the frontend UI whether to show registration or challenge boxes
      });
    }
  }

  // 🧪 ADD This THIRD LOG LINE BEFORE THE RETURN:
  Logger.log("Final Array Built for Frontend: " + JSON.stringify(verifiedProfileListing));
  
  return verifiedProfileListing;
}

/**
 * Performs a first-time setup commit, writing the plain text password string to the target user line
 */
function commitNewUserPasswordCredential(targetEmail, plainPasswordString) {
  const vaultId = GLOBAL_SYSTEM_CONFIG.CONFIG_IAM_MASTER_ID;
  const sheet = SpreadsheetApp.openById(vaultId).getSheetByName("IAM_Registry");
  const data = sheet.getDataRange().getValues();
  const searchEmail = targetEmail.toLowerCase().trim();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase().trim() === searchEmail) {
      // Confirm the safety guard is intact: stop users from overriding an already existing password
      if (String(data[i][2]).trim() !== "") {
        return { isAuthenticated: false, errorMessage: "Security Breach: Profile credentials already initialized." };
      }
      
      // Commit plain text entry directly into Column C (Index 3)
      sheet.getRange(i + 1, 3).setValue(plainPasswordString);
      sheet.getRange(i + 1, 5).setValue(new Date()); // Log Creation Timestamp into Column E
      SpreadsheetApp.flush();
      
      return { isAuthenticated: true, verifiedEmail: searchEmail };
    }
  }
  return { isAuthenticated: false, errorMessage: "Profile target matrix configuration failed lookup errors." };
}

/**
 * Evaluates returning credentials against the secure database vault row values
 */
function validateExistingUserCredentials(targetEmail, typedPasswordString) {
  const vaultId = GLOBAL_SYSTEM_CONFIG.CONFIG_IAM_MASTER_ID;
  const sheet = SpreadsheetApp.openById(vaultId).getSheetByName("IAM_Registry");
  const data = sheet.getDataRange().getValues();
  const searchEmail = targetEmail.toLowerCase().trim();
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase().trim() === searchEmail) {
      var storedPassword = String(data[i][2]).trim();
      var accountStatus  = String(data[i][1]).trim();
      
      if (accountStatus !== "Active") {
        return { isAuthenticated: false, errorMessage: "Profile Status: Suspended. Contact System Administrator." };
      }
      
      if (storedPassword === typedPasswordString) {
        sheet.getRange(i + 1, 5).setValue(new Date()); // Log Last Login Timestamp into Column E
        SpreadsheetApp.flush();
        return { isAuthenticated: true, verifiedEmail: searchEmail };
      } else {
        return { isAuthenticated: false, errorMessage: "Authentication Failed: Incorrect entry string." };
      }
    }
  }
  return { isAuthenticated: false, errorMessage: "Profile handle mismatch error bounds." };
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
