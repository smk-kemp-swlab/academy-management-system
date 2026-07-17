/**
 * ECOSYSTEM RECOGNITION PLATFORM ENGINE
 * Core Control Router for Live Warehouses & Test Sandboxes
 */

const GLOBAL_SYSTEM_CONFIG = {
  // 🌍 GLOBAL CONFIGURATION ANCHOR: CORE DATA SYSTEM
  CORE_HUB_ID: "1O3YUZqrq6o0i5mf7B__FgMYndR61yw4bResf2RDfYQ0",
  VAULT_ROOT_FOLDER_ID: "1jwV-3aqCSd804G51FdGb0AfpqwgwYRRQ",
  SPOKE_EVALUATIONS_ID: "1FueMRIcYxbE-30Awb8b3s3_ChrDq7bNsk-FRQmb5_Wk", 
  SPOKE_ATTENDANCE_ID: "11i7It5g5xXyT1dwJ_mnfoDtzCxJZDKyHp_l7b1DH6WM",
  SPOKE_FINANCIALS_ID: "1REgMO_SvWt_HmYqczLUXmaJAlr5SZgVRX8q8vflZN5c",

  // 🌍 GLOBAL CONFIGURATION ANCHOR: DEMO DATA SYSTEM
  DEMO_CORE_HUB_ID: "1KM5kOApWdKikRCiSCPGb8ldwpF3nbSvNQEVW0AltZig",
  DEMO_SPOKE_EVALUATIONS_ID: "1qJgZl0Z9iYGFnKfYska1c0eFNzCIIfvTveoZt029yVM",
  DEMO_SPOKE_ATTENDANCE_ID: "1eny4OoNqnne1cORYhDFF4IGQOnSCn9gkae5LczFa7Pg",
  DEMO_SPOKE_FINANCIALS_ID: "1rXnrfDVHrZH1NSfWwrTSRdpDatAS09RQP4CvCrUA-qs",

  // 🌍 GLOBAL CONFIGURATION ANCHOR: IDENTITY & ACCESS MANAGEMENT SYSTEM
  CONFIG_IAM_MASTER_ID: "1Ge1y-BOPhM0MtMTichv2Jv1PBVwMwKKsu3prw7a98O4",

  GLOBAL_TIMEZONE: "Asia/Kolkata"
}; 

function doGet(e) {
  var appModule = (e && e.parameter && e.parameter.app) || "eval";
  var fileName = "App_Performance_Engine";
  
  if (appModule === "attendance") fileName = "App_Attendance_System";
  if (appModule === "billing")    fileName = "App_Financial_Dashboard";
  if (appModule === "onboarding") fileName = "App_Onboarding_Form";
  
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

function provisionNewEvaluationTab(newTabName, frameworkType, isDemoMode) {
  try {
    var targetWarehouseId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_EVALUATIONS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_EVALUATIONS_ID;
    var ss = SpreadsheetApp.openById(targetWarehouseId);
    
    if (ss.getSheetByName(newTabName)) {
      return { success: false, error: "A session tab named '" + newTabName + "' already exists." };
    }
    
    var newSheet = ss.insertSheet(newTabName);
    var typeLower = (frameworkType || "").toLowerCase();
    var systemHeaders;

    var commonScoringHeaders = [
    "tac_Game_awareness_Rating", "tac_Game_awareness_Notes",
    "tac_Decision_making_Rating", "tac_Decision_making_Notes",
    "tac_Reading_the_game_Rating", "tac_Reading_the_game_Notes",
    "tac_Tempo_control_Rating", "tac_Tempo_control_Notes",
    "tac_Identification_of_key_passes_Rating", "tac_Identification_of_key_passes_Notes",
    "tac_Positioning___spatial_awareness_Rating", "tac_Positioning___spatial_awareness_Notes",
    "tac_Movement_off_the_ball_Rating", "tac_Movement_off_the_ball_Notes",
    "tac_Transition_reaction_Rating", "tac_Transition_reaction_Notes",
    "tac_In_possession_contribution_Rating", "tac_In_possession_contribution_Notes",
    "tac_Out_of_possession_contribution_Rating", "tac_Out_of_possession_contribution_Notes",
    "phys_Speed___acceleration_Rating", "phys_Speed___acceleration_Notes",
    "phys_Endurance___match_fitness_Rating", "phys_Endurance___match_fitness_Notes",
    "phys_Repeated_high_intensity_actions_Rating", "phys_Repeated_high_intensity_actions_Notes",
    "phys_Agility___change_of_direction_Rating", "phys_Agility___change_of_direction_Notes",
    "phys_Athleticism_Rating", "phys_Athleticism_Notes",
    "phys_Stride_mechanics_Rating", "phys_Stride_mechanics_Notes",
    "phys_Running_with_the_ball_Rating", "phys_Running_with_the_ball_Notes",
    "phys_Strength___balance_in_duels_Rating", "phys_Strength___balance_in_duels_Notes",
    "phys_Reaction_speed_Rating", "phys_Reaction_speed_Notes",
    "psych_Communication_Rating", "psych_Communication_Notes",
    "psych_Competitiveness_Rating", "psych_Competitiveness_Notes",
    "psych_Work_rate_Rating", "psych_Work_rate_Notes",
    "psych_Coachability_Rating", "psych_Coachability_Notes",
    "psych_Confidence_Rating", "psych_Confidence_Notes",
    "psych_Composure_Rating", "psych_Composure_Notes"
];

    var technicalScoringHeaders = [
    "tech_Dribbling_NoPressure", "tech_Dribbling_UnderPressure", "tech_Dribbling_Notes",
    "tech_Passing_NoPressure", "tech_Passing_UnderPressure", "tech_Passing_Notes",
    "tech_Receiving_first_touch_NoPressure", "tech_Receiving_first_touch_UnderPressure", "tech_Receiving_first_touch_Notes",
    "tech_Ball_control_NoPressure", "tech_Ball_control_UnderPressure", "tech_Ball_control_Notes",
    "tech_Ball_shielding_NoPressure", "tech_Ball_shielding_UnderPressure", "tech_Ball_shielding_Notes",
    "tech_Shooting___finishing_NoPressure", "tech_Shooting___finishing_UnderPressure", "tech_Shooting___finishing_Notes",
    "tech_Crossing___delivery_NoPressure", "tech_Crossing___delivery_UnderPressure", "tech_Crossing___delivery_Notes",
    "tech_Turning___body_orientation_NoPressure", "tech_Turning___body_orientation_UnderPressure", "tech_Turning___body_orientation_Notes",
    "tech_1v1_attacking_ability_NoPressure", "tech_1v1_attacking_ability_UnderPressure", "tech_1v1_attacking_ability_Notes",
    "tech_1v1_defending___tackling_NoPressure", "tech_1v1_defending___tackling_UnderPressure", "tech_1v1_defending___tackling_Notes"
];

    var summaryHeaders = [
        "Overall_Score", "Recommended_Action", "Assessor_Name",
        "Major_Strengths", "Improvement_Areas", "Final_Comments",
        "Assessment_Date", "Logged_Coach_Email", "Timestamp"
    ];

    if (typeLower === "trial") {
        // 🏃 Trial — full identity card + full scoring (technical included)
        systemHeaders = [
            "TX_Signature_Token", "Player_Name", "Trial_Number_Or_Bib", "Evaluation_Type", "Evaluation_Cycle_Tag",
            "Date_Of_Birth", "Preferred_Position", "Secondary_Position", "Dominant_Foot",
            "Previous_Club_Experience", "Contact_Number", "Injury_Notes"
        ].concat(technicalScoringHeaders).concat(commonScoringHeaders).concat(summaryHeaders);

    } else if (typeLower === "club") {
        // ⚽ Club — roster lookup identity, technical metrics hidden in UI, no technical columns
        systemHeaders = [
            "TX_Signature_Token", "Player_Name", "Trial_Number_Or_Bib", "Evaluation_Type", "Evaluation_Cycle_Tag"
        ].concat(commonScoringHeaders).concat(summaryHeaders);

    } else {
        // 🎓 Academy (default) — roster lookup identity, full scoring including technical
        systemHeaders = [
            "TX_Signature_Token", "Player_Name", "Trial_Number_Or_Bib", "Evaluation_Type", "Evaluation_Cycle_Tag"
        ].concat(technicalScoringHeaders).concat(commonScoringHeaders).concat(summaryHeaders);
    }
    
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
    
    // Inject live server timestamp into the Timestamp column
var timestampColIndex = currentHeaders.indexOf("Timestamp");
if (timestampColIndex !== -1) {
    rowValues[timestampColIndex] = Utilities.formatDate(new Date(), GLOBAL_SYSTEM_CONFIG.GLOBAL_TIMEZONE, "HH:mm:ss");
}
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
function submitStudentAttendance(records) {
  try {
    var ss = SpreadsheetApp.openById(GLOBAL_SYSTEM_CONFIG.SPOKE_ATTENDANCE_ID);
    var sheet = ss.getSheetByName("Student_Attendance_Log");
    
    if (!sheet) {
      return { success: false, error: "Student_Attendance_Log tab not found." };
    }
    
    var timestamp = Utilities.formatDate(new Date(), GLOBAL_SYSTEM_CONFIG.GLOBAL_TIMEZONE, "yyyy-MM-dd HH:mm:ss");
    
    records.forEach(function(record) {
      var logId = "ATT_STU_" + new Date().getTime() + "_" + Math.floor(Math.random() * 1000);
      sheet.appendRow([
        logId,
        timestamp,
        record.centerId,
        record.batchId,
        record.studentId,
        record.status,
        record.loggedBy
      ]);
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
function submitStaffAttendance(data) {
  try {
    var ss = SpreadsheetApp.openById(GLOBAL_SYSTEM_CONFIG.SPOKE_ATTENDANCE_ID);
    var sheet = ss.getSheetByName("Staff_Attendance_Log");
    
    if (!sheet) {
      return { success: false, error: "Staff_Attendance_Log tab not found." };
    }

    // Look up Full_Name and Role_Type from Staff_Registry
    var fullName = data.email;
    var roleType = "";
    try {
      var hubSS = SpreadsheetApp.openById(GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID);
      var staffSheet = hubSS.getSheetByName("Staff_Registry");
      var staffData = staffSheet.getDataRange().getValues();
      var headers = staffData[0];
      var emailIdx = headers.indexOf("Email_Address");
      var nameIdx = headers.indexOf("Full_Name");
      var roleIdx = headers.indexOf("Role_Type");
      
      for (var i = 1; i < staffData.length; i++) {
        if (staffData[i][emailIdx] && staffData[i][emailIdx].toString().toLowerCase().trim() === data.email.toLowerCase().trim()) {
          fullName = staffData[i][nameIdx] || data.email;
          roleType = staffData[i][roleIdx] || "";
          break;
        }
      }
    } catch(lookupError) {
      // If lookup fails, fall back to email
      fullName = data.email;
    }

    var logId = "ATT_STF_" + new Date().getTime() + "_" + Math.floor(Math.random() * 1000);
    var timestamp = Utilities.formatDate(new Date(), GLOBAL_SYSTEM_CONFIG.GLOBAL_TIMEZONE, "yyyy-MM-dd HH:mm:ss");
    
    var locationFlag = "Audit_Required";
    if (data.actionType === "Manual_Retro") {
      locationFlag = "Manual_Retro";
    } else if (data.city !== "Unknown" && data.city !== "Manual") {
      locationFlag = "Regional_Match";
    }

    var attendanceDate = data.retroDate || Utilities.formatDate(new Date(), GLOBAL_SYSTEM_CONFIG.GLOBAL_TIMEZONE, "yyyy-MM-dd");

    sheet.appendRow([
      logId,
      data.email,
      fullName,
      roleType,
      attendanceDate,
      timestamp,
      data.actionType,
      data.ip,
      data.isp || "",
      data.region ? data.city + ", " + data.region : data.city,
      locationFlag
    ]);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
// ========================================================================
// 💳 SUBSCRIPTION FINANCIALS — BILLING LEDGER ENGINE
// ========================================================================

/**
 * Loads all data needed for the Billing Dashboard in one call:
 * students (from Core Hub), fee configs, discounts, leaves, invoices (from Spoke_Financials)
 */
function getBillingDashboardContext(isDemoMode, staffEmail) {
  try {
    var hubId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_CORE_HUB_ID : GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID;
    var financeId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_FINANCIALS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID;
    var currentUserEmail = staffEmail || Session.getActiveUser().getEmail(); // ← keep only this one

    var hubSS = SpreadsheetApp.openById(hubId);
    var financeSS = SpreadsheetApp.openById(financeId);
    var rosterValues = hubSS.getSheetByName("Academy_Roster").getDataRange().getValues();
    var facilityValues = hubSS.getSheetByName("Facilities_Matrix").getDataRange().getValues();
    var batchValues = hubSS.getSheetByName("Batches_Registry").getDataRange().getValues();

    var feeConfigValues = financeSS.getSheetByName("Fee_Configuration_Matrix").getDataRange().getValues();
    var discountValues = financeSS.getSheetByName("Discount_Registry").getDataRange().getValues();
    var leaveValues = financeSS.getSheetByName("Approved_Leave_Registry").getDataRange().getValues();
    var invoiceValues = financeSS.getSheetByName("Billing_Ledger_Invoices").getDataRange().getValues();

    var staffValues2 = hubSS.getSheetByName("Staff_Registry").getDataRange().getValues();
    var staffObjects = parseSheetToObjects(staffValues2);
    var currentStaff = staffObjects.find(function(s) {
        return s.Email_Address && s.Email_Address.toString().toLowerCase().trim() === currentUserEmail.toLowerCase().trim();
    });
    var isAdmin = (currentUserEmail.toLowerCase() === "samirkamerkar@kempfc.com") ||
                  (currentUserEmail.toLowerCase() === "samir.kamerkar@gmail.com") ||
                  (currentStaff && (currentStaff.Role_Type === "Director" || currentStaff.Role_Type === "Admin"));
return JSON.parse(JSON.stringify({
    success: true,
    students: parseSheetToObjects(rosterValues),
    facilities: parseSheetToObjects(facilityValues),
    batches: parseSheetToObjects(batchValues),
    feeConfigs: parseSheetToObjects(feeConfigValues),
    discounts: parseSheetToObjects(discountValues),
    leaves: parseSheetToObjects(leaveValues),
    invoices: parseSheetToObjects(invoiceValues),
    isAdmin: isAdmin || false
}));
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * THE ANNIVERSARY / INTERVAL ENGINE + SLIDING MILESTONE ENGINE
 * Computes the billing cycle end date using exact day-count math,
 * then extends it by any approved leave days logged for the student.
 */
function computeAdjustedCycleEndDate(startDateStr, intervalDays, studentId, allLeaves) {
  var startDate = new Date(startDateStr);

  // Base Anniversary Date = start + interval days (exact day-count, no month rules)
  var baseEndDate = new Date(startDate.getTime());
  baseEndDate.setDate(baseEndDate.getDate() + Number(intervalDays));

  // Sliding Milestone Engine: sum Approved leave days for this student
  var totalApprovedBreakDays = 0;
  allLeaves.forEach(function(lv) {
    if (String(lv.Student_ID) === String(studentId) && String(lv.Approval_Status) === "Approved") {
      totalApprovedBreakDays += Number(lv.Total_Break_Days) || 0;
    }
  });

  var adjustedEndDate = new Date(baseEndDate.getTime());
  adjustedEndDate.setDate(adjustedEndDate.getDate() + totalApprovedBreakDays);

  return {
    baseEndDate: baseEndDate,
    adjustedEndDate: adjustedEndDate,
    totalApprovedBreakDays: totalApprovedBreakDays
  };
}

/**
 * Generates a new invoice row in Billing_Ledger_Invoices.
 * payload: { studentId, configId, discountId, billingCycleStartDate, staffEmail, isDemoMode }
 */
function generateNewInvoice(payload) {
  try {
    var financeId = payload.isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_FINANCIALS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID;
    var financeSS = SpreadsheetApp.openById(financeId);

    var feeConfigSheet = financeSS.getSheetByName("Fee_Configuration_Matrix");
    var feeConfigs = parseSheetToObjects(feeConfigSheet.getDataRange().getValues());
    var config = feeConfigs.find(function(c) { return String(c.Config_ID) === String(payload.configId); });
    if (!config) return { success: false, error: "Fee configuration not found." };

    var discountSheet = financeSS.getSheetByName("Discount_Registry");
    var discounts = parseSheetToObjects(discountSheet.getDataRange().getValues());
    var discount = payload.discountId ? discounts.find(function(d) { return String(d.Discount_ID) === String(payload.discountId); }) : null;

    var leaveSheet = financeSS.getSheetByName("Approved_Leave_Registry");
    var allLeaves = parseSheetToObjects(leaveSheet.getDataRange().getValues());

    var baseAmount = Number(config.Base_Fee_Amount) || 0;
    var discountPct = discount ? (Number(discount.Discount_Percentage) || 0) : 0;
    var netAmount = Math.round((baseAmount * (1 - discountPct / 100)) * 100) / 100;

    var cycleCalc = computeAdjustedCycleEndDate(
      payload.billingCycleStartDate,
      config.Billing_Interval_Days,
      payload.studentId,
      allLeaves
    );

    var tz = GLOBAL_SYSTEM_CONFIG.GLOBAL_TIMEZONE;
    var invoiceId = "INV-" + new Date().getTime();

    var row = [
      invoiceId,
      payload.studentId,
      Utilities.formatDate(new Date(payload.billingCycleStartDate), tz, "yyyy-MM-dd"),
      Utilities.formatDate(cycleCalc.adjustedEndDate, tz, "yyyy-MM-dd"),
      baseAmount,
      discount ? discount.Discount_ID : "",
      netAmount,
      0,
      "None",
      netAmount,
      0,
      "Unpaid",
      "",
      "",
      "",
      payload.staffEmail || "",
      ""
    ];

    financeSS.getSheetByName("Billing_Ledger_Invoices").appendRow(row);

    return {
      success: true,
      invoiceId: invoiceId,
      netAmount: netAmount,
      adjustedDueDate: Utilities.formatDate(cycleCalc.adjustedEndDate, tz, "yyyy-MM-dd"),
      leaveDaysApplied: cycleCalc.totalApprovedBreakDays
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Records a payment against an existing invoice and recalculates status.
 * paymentData: { invoiceId, amountPaid, paymentMode, transactionRef, staffEmail, isDemoMode }
 */
function markInvoicePayment(paymentData) {
  try {
    var financeId = paymentData.isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_FINANCIALS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID;
    var financeSS = SpreadsheetApp.openById(financeId);
    var sheet = financeSS.getSheetByName("Billing_Ledger_Invoices");
    var data = sheet.getDataRange().getValues();
    var headers = data[0];

    var idIdx = headers.indexOf("Invoice_ID");
    var totalDueIdx = headers.indexOf("Total_Due");
    var amountPaidIdx = headers.indexOf("Amount_Paid");
    var statusIdx = headers.indexOf("Payment_Status");
    var payDateIdx = headers.indexOf("Payment_Date");
    var payModeIdx = headers.indexOf("Payment_Mode");
    var txRefIdx = headers.indexOf("Transaction_Reference_No");
    var staffIdx = headers.indexOf("Logged_By_Staff_ID");

    for (var r = 1; r < data.length; r++) {
      if (String(data[r][idIdx]) === String(paymentData.invoiceId)) {
        var totalDue = Number(data[r][totalDueIdx]) || 0;
        var previouslyPaid = Number(data[r][amountPaidIdx]) || 0;
        var newAmountPaid = previouslyPaid + (Number(paymentData.amountPaid) || 0);

        var newStatus = "Unpaid";
        if (newAmountPaid >= totalDue && totalDue > 0) newStatus = "Fully_Paid";
        else if (newAmountPaid > 0) newStatus = "Partially_Paid";

        var tz = GLOBAL_SYSTEM_CONFIG.GLOBAL_TIMEZONE;
        var rowNum = r + 1;

        sheet.getRange(rowNum, amountPaidIdx + 1).setValue(newAmountPaid);
        sheet.getRange(rowNum, statusIdx + 1).setValue(newStatus);
        sheet.getRange(rowNum, payDateIdx + 1).setValue(Utilities.formatDate(new Date(), tz, "yyyy-MM-dd"));
        sheet.getRange(rowNum, payModeIdx + 1).setValue(paymentData.paymentMode || "");
        sheet.getRange(rowNum, txRefIdx + 1).setValue(paymentData.transactionRef || "");
        sheet.getRange(rowNum, staffIdx + 1).setValue(paymentData.staffEmail || "");

        return { success: true, newStatus: newStatus, newAmountPaid: newAmountPaid, totalDue: totalDue };
      }
    }

    return { success: false, error: "Invoice not found." };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
// ========================================================================
// 👥 ONBOARDING PIPELINE — PUBLIC REGISTRATION ENGINE
// ========================================================================

/**
 * Public, no-auth context for the registration form: just centers + batches.
 */
function getPublicOnboardingContext() {
  try {
    var hubSS = SpreadsheetApp.openById(GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID);
    var facilityValues = hubSS.getSheetByName("Facilities_Matrix").getDataRange().getValues();
    var batchValues = hubSS.getSheetByName("Batches_Registry").getDataRange().getValues();

    return JSON.parse(JSON.stringify({
      success: true,
      facilities: parseSheetToObjects(facilityValues),
      batches: parseSheetToObjects(batchValues)
    }));
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Writes a new application row to Onboarding_Pipeline.
 * formData: { centerId, batchId, firstName, lastName, dob, parentName, parentEmail,
 *             parentPhone, kitShirt, kitShorts, medicalAlerts, paymentStrategy }
 */
function submitOnboardingApplication(formData) {
  try {
    var financeSS = SpreadsheetApp.openById(GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID);
    var sheet = financeSS.getSheetByName("Onboarding_Pipeline");
    if (!sheet) return { success: false, error: "Onboarding_Pipeline tab not found." };

    var tz = GLOBAL_SYSTEM_CONFIG.GLOBAL_TIMEZONE;
    var applicationId = "APP-" + new Date().getTime();
    var timestamp = Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm:ss");

    var row = [
      applicationId,                          // Application_ID
      timestamp,                              // Submission_Timestamp
      formData.centerId || "",                // Target_Center_ID
      formData.batchId || "",                 // Target_Batch_ID
      formData.firstName || "",                // Player_First_Name
      formData.lastName || "",                 // Player_Last_Name
      formData.dob || "",                      // Player_DOB
      formData.parentName || "",                // Parent_Name
      formData.parentEmail || "",               // Parent_Email
      formData.parentPhone || "",               // Parent_Phone
      formData.kitShirt || "",                 // Kit_Shirt
      formData.kitShorts || "",                 // Kit_Shorts
      formData.medicalAlerts || "None",          // Medical_Alert_Flags
      formData.paymentStrategy || "Pay_Later",   // Selected_Payment_Strategy
      "",                                        // Transaction_Reference_Token
      "Pending_Review",                          // Review_Status
      ""                                         // Processed_By_Staff_ID
    ];

    sheet.appendRow(row);

    return { success: true, applicationId: applicationId };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
function getOnboardingApplications() {
  try {
    var financeSS = SpreadsheetApp.openById(GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID);
    var sheet = financeSS.getSheetByName("Onboarding_Pipeline");
    if (!sheet) return { success: false, error: "Onboarding_Pipeline tab not found." };
    var data = parseSheetToObjects(sheet.getDataRange().getValues());
    // Most recent first
    data.reverse();
    return JSON.parse(JSON.stringify({ success: true, applications: data }));
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
function updateApplicationStatus(applicationId, newStatus, staffEmail) {
  try {
    var financeSS = SpreadsheetApp.openById(GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID);
    var sheet = financeSS.getSheetByName("Onboarding_Pipeline");
    if (!sheet) return { success: false, error: "Onboarding_Pipeline tab not found." };

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idIdx = headers.indexOf("Application_ID");
    var statusIdx = headers.indexOf("Review_Status");
    var staffIdx = headers.indexOf("Processed_By_Staff_ID");

    for (var r = 1; r < data.length; r++) {
      if (String(data[r][idIdx]) === String(applicationId)) {
        sheet.getRange(r + 1, statusIdx + 1).setValue(newStatus);
        sheet.getRange(r + 1, staffIdx + 1).setValue(staffEmail);

        if (newStatus === "Approved") {
          var promotionResult = promoteApplicationToStudent(applicationId, staffEmail);
          if (!promotionResult.success) {
            return { success: true, warning: "Status updated, but failed to create student profile: " + promotionResult.error };
          }
          return { success: true, newStudentId: promotionResult.newStudentId };
        }

        return { success: true };
      }
    }
    return { success: false, error: "Application not found." };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
/**
 * Generates the next sequential Academy Roster Student_ID (e.g. ACA-001, ACA-002...)
 */
function generateNextStudentId(existingStudents) {
  var maxNum = 0;
  existingStudents.forEach(function(s) {
    var match = String(s.Student_ID || "").match(/ACA-(\d+)/);
    if (match) {
      var num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  var nextNum = maxNum + 1;
  var padded = ("000" + nextNum).slice(-3);
  return "ACA-" + padded;
}

/**
 * Promotes an approved onboarding application into a real Academy_Roster student.
 * Called automatically when an application's status is set to "Approved".
 */
function promoteApplicationToStudent(applicationId, staffEmail) {
  try {
    var financeSS = SpreadsheetApp.openById(GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID);
    var onboardingSheet = financeSS.getSheetByName("Onboarding_Pipeline");
    var applications = parseSheetToObjects(onboardingSheet.getDataRange().getValues());
    var app = applications.find(function(a) { return String(a.Application_ID) === String(applicationId); });

    if (!app) return { success: false, error: "Application not found for promotion." };

    var hubSS = SpreadsheetApp.openById(GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID);
    var rosterSheet = hubSS.getSheetByName("Academy_Roster");
    var existingStudents = parseSheetToObjects(rosterSheet.getDataRange().getValues());

    // Safety check: avoid creating a duplicate if this application was already promoted before
    var alreadyExists = existingStudents.some(function(s) {
      return s.Parent_Email === app.Parent_Email &&
             s.First_Name === app.Player_First_Name &&
             s.Last_Name === app.Player_Last_Name;
    });
    if (alreadyExists) {
      return { success: true, alreadyPromoted: true };
    }

    var newStudentId = generateNextStudentId(existingStudents);
    var tz = GLOBAL_SYSTEM_CONFIG.GLOBAL_TIMEZONE;

    var row = [
      newStudentId,                                                    // Student_ID
      app.Player_First_Name || "",                                     // First_Name
      app.Player_Last_Name || "",                                      // Last_Name
      app.Player_DOB || "",                                            // DOB
      app.Parent_Name || "",                                           // Parent_Name
      app.Parent_Email || "",                                          // Parent_Email
      app.Parent_Phone || "",                                          // Parent_Phone
      app.Target_Center_ID || "",                                      // Academy_Center_ID
      app.Target_Batch_ID || "",                                       // Academy_Batch_ID
      app.Kit_Shirt || "",                                             // Kit_Size_Shirt
      app.Kit_Shorts || "",                                            // Kit_Size_Shorts
      app.Medical_Alert_Flags || "None",                               // Medical_Alert_Flags
      Utilities.formatDate(new Date(), tz, "yyyy-MM-dd"),              // Onboarding_Date
      "Active"                                                         // Status
    ];

    rosterSheet.appendRow(row);

    return { success: true, newStudentId: newStudentId };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
// ========================================================================
// 🏖️ APPROVED LEAVE REGISTRY — SLIDING MILESTONE ENGINE UI
// ========================================================================

/**
 * Returns all leave requests, most recent first.
 */
function getLeaveRequests() {
  try {
    var financeSS = SpreadsheetApp.openById(GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID);
    var sheet = financeSS.getSheetByName("Approved_Leave_Registry");
    if (!sheet) return { success: false, error: "Approved_Leave_Registry tab not found." };

    var data = parseSheetToObjects(sheet.getDataRange().getValues());
    data.reverse();
    return JSON.parse(JSON.stringify({ success: true, leaves: data }));
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Submits a new leave request with Approval_Status = "Pending".
 * payload: { studentId, breakStartDate, breakEndDate, leaveReason, staffEmail }
 */
function submitLeaveRequest(payload) {
  try {
    var financeSS = SpreadsheetApp.openById(GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID);
    var sheet = financeSS.getSheetByName("Approved_Leave_Registry");
    if (!sheet) return { success: false, error: "Approved_Leave_Registry tab not found." };

    var start = new Date(payload.breakStartDate);
    var end = new Date(payload.breakEndDate);
    if (end < start) return { success: false, error: "End date cannot be before start date." };

    // Inclusive day count (both start and end day count as break days)
    var totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    var tz = GLOBAL_SYSTEM_CONFIG.GLOBAL_TIMEZONE;
    var leaveId = "LV-" + new Date().getTime();

    var row = [
      leaveId,                                                        // Leave_ID
      payload.studentId,                                              // Student_ID
      Utilities.formatDate(start, tz, "yyyy-MM-dd"),                  // Break_Start_Date
      Utilities.formatDate(end, tz, "yyyy-MM-dd"),                    // Break_End_Date
      totalDays,                                                      // Total_Break_Days
      payload.leaveReason || "",                                      // Leave_Reason
      "Pending",                                                      // Approval_Status
      payload.staffEmail || ""                                        // Authorized_By_Staff_ID
    ];

    sheet.appendRow(row);

    return { success: true, leaveId: leaveId, totalDays: totalDays };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Approves or rejects a pending leave request.
 */
function updateLeaveStatus(leaveId, newStatus, staffEmail) {
  try {
    var financeSS = SpreadsheetApp.openById(GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID);
    var sheet = financeSS.getSheetByName("Approved_Leave_Registry");
    if (!sheet) return { success: false, error: "Approved_Leave_Registry tab not found." };

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idIdx = headers.indexOf("Leave_ID");
    var statusIdx = headers.indexOf("Approval_Status");
    var staffIdx = headers.indexOf("Authorized_By_Staff_ID");

    for (var r = 1; r < data.length; r++) {
      if (String(data[r][idIdx]) === String(leaveId)) {
        sheet.getRange(r + 1, statusIdx + 1).setValue(newStatus);
        sheet.getRange(r + 1, staffIdx + 1).setValue(staffEmail);
        return { success: true };
      }
    }
    return { success: false, error: "Leave request not found." };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
// ========================================================================
// 📁 DOCUMENT VAULT — UPLOAD ENGINE (CORRECTED PER DESIGN SECTION 2)
// ========================================================================

/**
 * Gets a subfolder by name inside a parent folder, creating it if it doesn't exist.
 * Uses a script lock to prevent race conditions when multiple uploads
 * (e.g. Birth Cert + Medical + Waiver) run in parallel for the same student.
 */
function getOrCreateSubfolder(parentFolder, folderName) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000); // wait up to 30 seconds for the lock

  try {
    var existing = parentFolder.getFoldersByName(folderName);
    if (existing.hasNext()) {
      return existing.next();
    }
    return parentFolder.createFolder(folderName);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Uploads a document to the correct nested Drive path:
 * Master Academy Vault > Center Folder > Player Folder > file
 * File permissions are left as Owner-only (Master Admin identity) —
 * NOT shared publicly, per design Section 2.3.
 *
 * payload: { entityId, playerName, centerName, documentType, base64Data, mimeType, fileName }
 */
function uploadEntityDocument(payload) {
  try {
    var rootFolder = DriveApp.getFolderById(GLOBAL_SYSTEM_CONFIG.VAULT_ROOT_FOLDER_ID);

    var centerName = payload.centerName || "Unassigned_Center";
    var centerFolder = getOrCreateSubfolder(rootFolder, centerName);

    var safePlayerFolderName = (payload.entityId + "_" + (payload.playerName || "Unknown")).replace(/[\\/:*?"<>|]/g, "_");
    var playerFolder = getOrCreateSubfolder(centerFolder, safePlayerFolderName);

    var blob = Utilities.newBlob(
      Utilities.base64Decode(payload.base64Data),
      payload.mimeType,
      payload.documentType + "_" + payload.fileName
    );

    var file = playerFolder.createFile(blob);

    var financeSS = SpreadsheetApp.openById(GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID);
    var sheet = financeSS.getSheetByName("Document_Vault_Registry");
    if (!sheet) return { success: false, error: "Document_Vault_Registry tab not found." };

    var tz = GLOBAL_SYSTEM_CONFIG.GLOBAL_TIMEZONE;
    var docId = "DOC-" + new Date().getTime();
    var secureRef = "internal://" + file.getId();

    sheet.appendRow([
      docId,
      payload.entityId,
      payload.documentType,
      file.getId(),
      secureRef,
      "Unverified",
      Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm:ss")
    ]);

    return { success: true, docId: docId };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
/**
 * Securely serves a document's content to an AUTHORIZED STAFF MEMBER ONLY,
 * for viewing inside the Admin Verification Panel. The file itself is never
 * made public — this function runs under the Master Admin script identity
 * (Execute as: Me) and returns the bytes directly to the authenticated
 * staff session that requested it.
 *
 * payload: { fileId, requestingStaffEmail }
 */
function getSecureDocumentView(payload) {
  try {
    if (!payload.requestingStaffEmail) {
      return { success: false, error: "Unauthorized: no staff identity on request." };
    }

    var file = DriveApp.getFileById(payload.fileId);
    var blob = file.getBlob();
    var base64Data = Utilities.base64Encode(blob.getBytes());

    return {
      success: true,
      base64Data: base64Data,
      mimeType: blob.getContentType(),
      fileName: file.getName()
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
/**
 * Fetches all uploaded documents tied to a given entity (e.g. an Application_ID),
 * for display in the Admin Verification Panel.
 */
function getDocumentsForEntity(entityId) {
  try {
    var financeSS = SpreadsheetApp.openById(GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID);
    var sheet = financeSS.getSheetByName("Document_Vault_Registry");
    if (!sheet) return { success: false, error: "Document_Vault_Registry tab not found." };

    var allDocs = parseSheetToObjects(sheet.getDataRange().getValues());
    var matchingDocs = allDocs.filter(function(d) {
      return String(d.Entity_ID) === String(entityId);
    });

    return JSON.parse(JSON.stringify({ success: true, documents: matchingDocs }));
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
function saveFeeConfiguration(payload) {
  try {
    var financeSS = SpreadsheetApp.openById(GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID);
    var sheet = financeSS.getSheetByName("Fee_Configuration_Matrix");
    if (!sheet) return { success: false, error: "Fee_Configuration_Matrix tab not found." };

    var configId = "FEE-" + new Date().getTime();

    sheet.appendRow([
      configId,
      payload.centerId,
      payload.ageGroup,
      payload.programType,
      payload.billingIntervalDays,
      Number(payload.baseFeeAmount) || 0,
      Number(payload.kitFeeAmount) || 0,
      Number(payload.registrationFeeAmount) || 0
    ]);

    return { success: true, configId: configId };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
function saveDiscountConfiguration(payload) {
  try {
    var financeSS = SpreadsheetApp.openById(GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID);
    var sheet = financeSS.getSheetByName("Discount_Registry");
    if (!sheet) return { success: false, error: "Discount_Registry tab not found." };

    var discountId = "DIS-" + new Date().getTime();
    sheet.appendRow([
      discountId,
      payload.name,
      Number(payload.percentage)
    ]);

    return { success: true, discountId: discountId };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
function deleteInvoice(invoiceId, staffEmail) {
  try {
    var financeSS = SpreadsheetApp.openById(GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID);
    var sheet = financeSS.getSheetByName("Billing_Ledger_Invoices");
    if (!sheet) return { success: false, error: "Billing_Ledger_Invoices tab not found." };
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idIdx = headers.indexOf("Invoice_ID");
    for (var r = 1; r < data.length; r++) {
      if (String(data[r][idIdx]) === String(invoiceId)) {
        sheet.deleteRow(r + 1);
        return { success: true };
      }
    }
    return { success: false, error: "Invoice not found." };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
function deleteFeeConfig(feeConfigId, staffEmail) {
  try {
    var financeSS = SpreadsheetApp.openById(GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID);
    var sheet = financeSS.getSheetByName("Fee_Configuration_Matrix");
    if (!sheet) return { success: false, error: "Fee_Configuration_Matrix tab not found." };
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idIdx = headers.indexOf("Fee_Config_ID");
    for (var r = 1; r < data.length; r++) {
      if (String(data[r][idIdx]) === String(feeConfigId)) {
        sheet.deleteRow(r + 1);
        return { success: true };
      }
    }
    return { success: false, error: "Fee config not found." };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

function deleteDiscount(discountId, staffEmail) {
  try {
    var financeSS = SpreadsheetApp.openById(GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID);
    var sheet = financeSS.getSheetByName("Discount_Registry");
    if (!sheet) return { success: false, error: "Discount_Registry tab not found." };
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idIdx = headers.indexOf("Discount_ID");
    for (var r = 1; r < data.length; r++) {
      if (String(data[r][idIdx]) === String(discountId)) {
        sheet.deleteRow(r + 1);
        return { success: true };
      }
    }
    return { success: false, error: "Discount not found." };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
function generateInvoicePDF(invoiceId) {
  try {
    var financeSS = SpreadsheetApp.openById(GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID);
    var invoiceSheet = financeSS.getSheetByName("Billing_Ledger_Invoices");
    var hubSS = SpreadsheetApp.openById(GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID);
    var rosterSheet = hubSS.getSheetByName("Academy_Roster");

    var invoices = parseSheetToObjects(invoiceSheet.getDataRange().getValues());
    var students = parseSheetToObjects(rosterSheet.getDataRange().getValues());

    var inv = invoices.find(function(i) { return i.Invoice_ID === invoiceId; });
    if (!inv) return { success: false, error: "Invoice not found." };

    var student = students.find(function(s) { return s.Student_ID === inv.Student_ID; });
    var studentName = student ? student.First_Name + " " + student.Last_Name : inv.Student_ID;
    var balance = (Number(inv.Total_Due) || 0) - (Number(inv.Amount_Paid) || 0);

    var html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Invoice ${inv.Invoice_ID}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; max-width: 600px; margin: 0 auto; }
      .header { text-align: center; border-bottom: 2px solid #dc2626; padding-bottom: 20px; margin-bottom: 30px; }
      .header h1 { color: #dc2626; margin: 0; font-size: 28px; }
      .header p { margin: 4px 0; color: #64748b; font-size: 13px; }
      .invoice-id { background: #f1f5f9; padding: 10px 16px; border-radius: 8px; font-size: 13px; margin-bottom: 20px; }
      .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
      .row:last-child { border-bottom: none; }
      .label { color: #64748b; }
      .value { font-weight: 700; }
      .total-row { background: #f8fafc; padding: 14px 16px; border-radius: 8px; margin-top: 20px; }
      .status { display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; }
      .Fully_Paid { background: #f0fdf4; color: #166534; }
      .Partially_Paid { background: #fffbeb; color: #92400e; }
      .Unpaid { background: #fef2f2; color: #991b1b; }
      .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #94a3b8; }
      @media print { body { padding: 20px; } button { display: none; } }
    </style></head><body>
    <div class="header">
      <h1>KEMP FC</h1>
      <p>Academy Fee Invoice</p>
    </div>
    <div class="invoice-id">
      Invoice ID: <strong>${inv.Invoice_ID}</strong> &nbsp;|&nbsp;
      Status: <span class="status ${inv.Payment_Status}">${(inv.Payment_Status || '').replace('_', ' ')}</span>
    </div>
    <div class="row"><span class="label">Student Name</span><span class="value">${studentName}</span></div>
    <div class="row"><span class="label">Student ID</span><span class="value">${inv.Student_ID}</span></div>
    <div class="row"><span class="label">Billing Period</span><span class="value">${inv.Billing_Cycle_Start_Date} → ${inv.Billing_Cycle_End_Date}</span></div>
    <div class="row"><span class="label">Total Due</span><span class="value">₹${Number(inv.Total_Due).toFixed(2)}</span></div>
    <div class="row"><span class="label">Amount Paid</span><span class="value">₹${Number(inv.Amount_Paid).toFixed(2)}</span></div>
    <div class="total-row row"><span class="label">Balance</span><span class="value" style="color:${balance > 0 ? '#dc2626' : '#166534'};">₹${balance.toFixed(2)}</span></div>
    <div class="footer">
      <p>Kemp FC Academy &nbsp;|&nbsp; Generated on ${new Date().toLocaleDateString('en-IN')}</p>
      <p style="margin-top:16px;"><button onclick="window.print()" style="background:#dc2626; color:white; border:none; padding:10px 24px; border-radius:6px; cursor:pointer; font-size:14px;">🖨️ Print / Save as PDF</button></p>
    </div>
    </body></html>`;

    return { success: true, html: html };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
