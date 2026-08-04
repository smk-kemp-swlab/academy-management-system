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
  DEMO_CORE_HUB_ID: "1YZfUBsx3NzdVQ6GxiwoJcQjJ3sNeNy0p2VGDr7uUg7k",
  DEMO_SPOKE_EVALUATIONS_ID: "1bJUeMUcU9r9eOkH1BcS7CDf4ArYyBIpLiGRk9X7enx4",
  DEMO_SPOKE_ATTENDANCE_ID: "13ETYFEH1Y4tVSYmbH1LCmAm70oQucQnnMl9EG9Jp0hY",
  DEMO_SPOKE_FINANCIALS_ID: "1qFKzMNAXhFQ5auS3ashgD3bZwf4WWSnNv-u71-hNtRA",

  // 🌍 GLOBAL CONFIGURATION ANCHOR: IDENTITY & ACCESS MANAGEMENT SYSTEM

  CONFIG_IAM_MASTER_ID: "1Ge1y-BOPhM0MtMTichv2Jv1PBVwMwKKsu3prw7a98O4",
  DEMO_CONFIG_IAM_MASTER_ID :"1wcQGdHqKBlMrMDvMmzc1nKr-6Nu6fHKfxyPr6M5ua0I",

  GLOBAL_TIMEZONE: "Asia/Kolkata"
}; 
//This is the entry point of a Google Apps Script web application. (Main)
function doGet(e) {
  var appModule = (e && e.parameter && e.parameter.app) || "eval";
  var academyId = (e && e.parameter && e.parameter.school) || "default";
  var fileName = "App_Performance_Engine";
  
  if (appModule === "attendance") fileName = "App_Attendance_System";
  if (appModule === "billing")    fileName = "App_Financial_Dashboard";
  if (appModule === "onboarding") fileName = "App_Onboarding_Form";
  if (appModule === "staff")      fileName = "App_Staff_Board";
  if (appModule === "custom_session") fileName = "App_Custom_Session";
  
var template = HtmlService.createTemplateFromFile(fileName);
  var branding = getBrandingConfig(academyId);

  template.brandAcademyName = branding.Academy_Name;
  template.brandLogoUrl = branding.Logo_URL;
  template.brandColorPrimary = branding.Color_Primary;
  template.brandColorDark = branding.Color_Dark;
  template.brandColorLight = branding.Color_Light;
  template.brandColorBorder = branding.Color_Border;
  template.brandColorBlue = branding.Color_Blue;
  template.brandColorSuccess = branding.Color_Success;

  // Pass through custom-session URL params server-side, since window.location.search
  // inside the rendered iframe does not reflect the outer page's real query string.
template.urlSessionName = (e && e.parameter && e.parameter.session) || "";
template.urlCoachEmail = (e && e.parameter && e.parameter.coach) || "";
template.urlIsDemoMode = (e && e.parameter && e.parameter.demo === "true");
template.urlPageMode = (e && e.parameter && e.parameter.mode) || "entry";
template.deployedUrl = ScriptApp.getService().getUrl();

  return template.evaluate()
      .setTitle(branding.Academy_Name + ' Management Suite')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
}
//called when performance engine starts
//loads all the data and send it to the frontend
function getPerformanceEngineContext(isDemoMode, staffEmail) {
  try {
    var userEmail = staffEmail || Session.getActiveUser().getEmail();
    var hasValidEmail = (userEmail && userEmail.trim() !== "");
    
    var targetHubId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_CORE_HUB_ID : GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID;
    if (!targetHubId) throw new Error("Target Master Hub ID mapping key is unconfigured.");
    
    var hubSS = SpreadsheetApp.openById(targetHubId);
    
    var staffValues = hubSS.getSheetByName("Staff_Registry").getDataRange().getValues();
    var facilityValues = hubSS.getSheetByName("Facilities_Matrix").getDataRange().getValues();
    var batchValues = hubSS.getSheetByName("Batches_Registry").getDataRange().getValues();
    var rosterValues = hubSS.getSheetByName("Academy_Roster").getDataRange().getValues();
    
    var staffObjects = parseSheetToObjects(staffValues);
    var currentStaff = staffObjects.find(function(s) {
        return s.Email_Address && s.Email_Address.toString().toLowerCase().trim() === (userEmail || "").toLowerCase().trim();
    });
    var isAdminUser = currentStaff && (currentStaff.Role_Type === "Director" || currentStaff.Role_Type === "Admin");
    
    var masterPayload = {
      coaches: parseColumnToFilteredArray(staffValues, "Email_Address"),
      facilities: parseSheetToObjects(facilityValues),
      batches: parseSheetToObjects(batchValues),
      players: parseSheetToObjects(rosterValues),
      
      currentUserEmailTrace: userEmail,
      isAdmin: isAdminUser || false,
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
function provisionNewEvaluationTab(newTabName, frameworkType, isDemoMode, templateType, customColumns) {
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

    if (templateType === 'custom' && customColumns && customColumns.length > 0) {
        var requiredCustomIdentity = ["TX_Signature_Token", "Player_Name", "Trial_Number_Or_Bib"];
        systemHeaders = requiredCustomIdentity.concat(customColumns);
      } else if (typeLower === "trial") {
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
        // 🎓 Academy (default) — roster lookup identity, Tactical/Physical/Psych only (no Technical — matches Club, matches UI)
        systemHeaders = [
            "TX_Signature_Token", "Player_Name", "Trial_Number_Or_Bib", "Evaluation_Type", "Evaluation_Cycle_Tag"
        ].concat(commonScoringHeaders).concat(summaryHeaders);
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

function getActiveEvaluationSessions(isDemoMode, frameworkType) {
  try {
    var targetWarehouseId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_EVALUATIONS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_EVALUATIONS_ID;
    var ss = SpreadsheetApp.openById(targetWarehouseId);
    var typeLower = (frameworkType || "").toLowerCase();

    var matchingTabs = ss.getSheets().filter(function(sh) {
      var name = sh.getName();
      if (name.indexOf('CUSTOM_') === 0) return false;

      var metadata = sh.getDeveloperMetadata();
      var storedType = null;
      for (var i = 0; i < metadata.length; i++) {
        if (metadata[i].getKey() === 'frameworkType') {
          storedType = metadata[i].getValue();
          break;
        }
      }

      // Sheets created before this fix have no tag — treat untagged sheets as visible everywhere
      if (!storedType) return true;

      return storedType === typeLower;
    }).map(function(sh) { return sh.getName(); });

    return { success: true, tabs: matchingTabs };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
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
 * Scans the centralized IAM ledger and extracts profile addresses authorized for the active script scope —
 * now also cross-checked against Staff_Registry so only currently Active staff can ever appear in the login list,
 * even if their IAM_Registry row is still sitting there from before.
 */
<<<<<<< HEAD
function fetchAuthorizedApplicationProfiles(appScopeKey) {
  const vaultId = GLOBAL_SYSTEM_CONFIG.CONFIG_IAM_MASTER_ID; 
  const sheet = SpreadsheetApp.openById(vaultId).getSheetByName("IAM_Registry");
  const data = sheet.getDataRange().getValues();

  // 🛡️ Build a set of currently Active staff emails from Staff_Registry (the real source of truth)
  var activeStaffEmails = {};
  try {
    var hubSS = SpreadsheetApp.openById(GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID);
=======
function fetchAuthorizedApplicationProfiles(appScopeKey, isDemoMode) {
  const vaultId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_CONFIG_IAM_MASTER_ID : GLOBAL_SYSTEM_CONFIG.CONFIG_IAM_MASTER_ID;
  const sheet = SpreadsheetApp.openById(vaultId).getSheetByName("IAM_Registry");
  const data = sheet.getDataRange().getValues();

  var activeStaffEmails = {};
  try {
    var hubId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_CORE_HUB_ID : GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID;
    var hubSS = SpreadsheetApp.openById(hubId);
>>>>>>> 8f1241a (demo moded add)
    var staffSheet = hubSS.getSheetByName("Staff_Registry");
    var staffData = staffSheet.getDataRange().getValues();
    var staffHeaders = staffData[0];
    var emailIdx = staffHeaders.indexOf("Email_Address");
    var statusIdx = staffHeaders.indexOf("Status");

    for (var s = 1; s < staffData.length; s++) {
      var staffEmailCell = String(staffData[s][emailIdx] || "").toLowerCase().trim();
      var staffStatusCell = String(staffData[s][statusIdx] || "").trim();
      if (staffEmailCell && staffStatusCell === "Active") {
        activeStaffEmails[staffEmailCell] = true;
      }
    }
  } catch (staffLookupError) {
<<<<<<< HEAD
    // If Staff_Registry can't be read for any reason, fail safe: treat as no active staff,
    // so a broken lookup locks things down rather than silently granting broad access.
=======
>>>>>>> 8f1241a (demo moded add)
    Logger.log("Staff_Registry cross-check failed: " + staffLookupError.toString());
  }

  let verifiedProfileListing = [];

  for (let i = 1; i < data.length; i++) {
    var emailCell   = String(data[i][0]).toLowerCase().trim();
    var statusCell  = String(data[i][1]).trim();
    var passwordCell = String(data[i][2]).trim();
    var approvedApps = String(data[i][3]).toLowerCase().trim();

    var isIamActive = (statusCell === "Active");
    var isScopeApproved = (approvedApps.indexOf(appScopeKey) !== -1);
    var isActiveStaffMember = !!activeStaffEmails[emailCell];

<<<<<<< HEAD
    Logger.log("Row " + (i+1) + " -> Email: '" + emailCell + "' | IAM Active: " + isIamActive + " | Scope Match: " + isScopeApproved + " | Active Staff: " + isActiveStaffMember);

=======
>>>>>>> 8f1241a (demo moded add)
    if (isIamActive && isScopeApproved && isActiveStaffMember) {
      verifiedProfileListing.push({
        email: emailCell,
        hasPassword: (passwordCell !== "")
      });
    }
  }

<<<<<<< HEAD
  Logger.log("Final Array Built for Frontend: " + JSON.stringify(verifiedProfileListing));

=======
>>>>>>> 8f1241a (demo moded add)
  return verifiedProfileListing;
}

function commitNewUserPasswordCredential(targetEmail, plainPasswordString, isDemoMode) {
  const vaultId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_CONFIG_IAM_MASTER_ID : GLOBAL_SYSTEM_CONFIG.CONFIG_IAM_MASTER_ID;
  const sheet = SpreadsheetApp.openById(vaultId).getSheetByName("IAM_Registry");
  const data = sheet.getDataRange().getValues();
  const searchEmail = targetEmail.toLowerCase().trim();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase().trim() === searchEmail) {
      if (String(data[i][2]).trim() !== "") {
        return { isAuthenticated: false, errorMessage: "Security Breach: Profile credentials already initialized." };
      }
      sheet.getRange(i + 1, 3).setValue(plainPasswordString);
      sheet.getRange(i + 1, 5).setValue(new Date());
      SpreadsheetApp.flush();
      return { isAuthenticated: true, verifiedEmail: searchEmail };
    }
  }
  return { isAuthenticated: false, errorMessage: "Profile target matrix configuration failed lookup errors." };
}

function validateExistingUserCredentials(targetEmail, typedPasswordString, isDemoMode) {
  const vaultId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_CONFIG_IAM_MASTER_ID : GLOBAL_SYSTEM_CONFIG.CONFIG_IAM_MASTER_ID;
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
        sheet.getRange(i + 1, 5).setValue(new Date());
        SpreadsheetApp.flush();
        return { isAuthenticated: true, verifiedEmail: searchEmail };
      } else {
        return { isAuthenticated: false, errorMessage: "Authentication Failed: Incorrect entry string." };
      }
    }
  }
  return { isAuthenticated: false, errorMessage: "Profile handle mismatch error bounds." };
}
function submitStudentAttendance(records, isDemoMode) {
  try {
    var targetId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_ATTENDANCE_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_ATTENDANCE_ID;
    var ss = SpreadsheetApp.openById(targetId);
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
    var targetId = data.isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_ATTENDANCE_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_ATTENDANCE_ID;
    var hubTargetId = data.isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_CORE_HUB_ID : GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID;
    var ss = SpreadsheetApp.openById(targetId);
    var sheet = ss.getSheetByName("Staff_Attendance_Log");
    
    if (!sheet) {
      return { success: false, error: "Staff_Attendance_Log tab not found." };
    }

    var fullName = data.email;
    var roleType = "";
    try {
      var hubSS = SpreadsheetApp.openById(hubTargetId);
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

   var liveLocationLink = "";
    if (data.latitude && data.longitude) {
      liveLocationLink = "https://www.google.com/maps?q=" + data.latitude + "," + data.longitude;
    }

    // sheet.appendRow([
    //   logId,
    //   data.email,
    //   fullName,
    //   roleType,
    //   attendanceDate,
    //   timestamp,
    //   data.actionType,
    //   data.ip,
    //   data.isp || "",
    //   data.locationName || (data.region ? data.city + ", " + data.region : data.city),
    //   locationFlag,
    //   liveLocationLink
    // ]);
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
      locationFlag,
      liveLocationLink
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
    var currentUserEmail = staffEmail || Session.getActiveUser().getEmail();

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
    var rolePermissions = getRolePermissions(currentStaff ? currentStaff.Role_Type : "");

    return JSON.parse(JSON.stringify({
        success: true,
        students: parseSheetToObjects(rosterValues),
        facilities: parseSheetToObjects(facilityValues),
        batches: parseSheetToObjects(batchValues),
        feeConfigs: parseSheetToObjects(feeConfigValues),
        discounts: parseSheetToObjects(discountValues),
        leaves: parseSheetToObjects(leaveValues),
        invoices: parseSheetToObjects(invoiceValues),
        isAdmin: rolePermissions.isAdmin,
        permissions: rolePermissions
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
function computeAdjustedCycleEndDate(startDateStr, intervalDays, studentId, allLeaves, priorInvoices) {
  var startDate = new Date(startDateStr);

  // Base Anniversary Date = start + interval days (exact day-count, no month rules)
  var baseEndDate = new Date(startDate.getTime());
  baseEndDate.setDate(baseEndDate.getDate() + Number(intervalDays));

  // Find this student's most recent prior invoice's cycle end date, if any.
  // Only leave that ENDED AFTER that date counts here — leave already used to
  // adjust a previous invoice's due date must never be counted again.
  var mostRecentCycleEnd = null;
  (priorInvoices || []).forEach(function(inv) {
    if (String(inv.Student_ID) !== String(studentId)) return;
    var endDate = new Date(inv.Billing_Cycle_End_Date);
    if (!isNaN(endDate.getTime()) && (!mostRecentCycleEnd || endDate > mostRecentCycleEnd)) {
      mostRecentCycleEnd = endDate;
    }
  });

  // Sliding Milestone Engine: sum only "new" Approved leave days for this student
  var totalApprovedBreakDays = 0;
  allLeaves.forEach(function(lv) {
    if (String(lv.Student_ID) !== String(studentId) || String(lv.Approval_Status) !== "Approved") return;
    var leaveEnd = new Date(lv.Break_End_Date);
    if (isNaN(leaveEnd.getTime())) return;
    if (mostRecentCycleEnd && leaveEnd <= mostRecentCycleEnd) return; // already counted previously
    totalApprovedBreakDays += Number(lv.Total_Break_Days) || 0;
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
    var hubIdCheck = payload.isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_CORE_HUB_ID : GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID;
    var hubSSCheck = SpreadsheetApp.openById(hubIdCheck);
    var staffSheetCheck = hubSSCheck.getSheetByName("Staff_Registry");
    var staffDataCheck = parseSheetToObjects(staffSheetCheck.getDataRange().getValues());
    var callerStaff = staffDataCheck.find(function(s) {
        return s.Email_Address && s.Email_Address.toString().toLowerCase().trim() === (payload.staffEmail || "").toLowerCase().trim();
    });
    var callerPermissions = getRolePermissions(callerStaff ? callerStaff.Role_Type : "");
    if (!callerPermissions.canGenerateInvoice) {
      return { success: false, error: "Permission denied: you are not authorized to generate invoices." };
    }

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

    var invoiceSheet = financeSS.getSheetByName("Billing_Ledger_Invoices");
    var allPriorInvoices = parseSheetToObjects(invoiceSheet.getDataRange().getValues());

    var baseAmount = Number(config.Base_Fee_Amount) || 0;
    var discountPct = discount ? (Number(discount.Discount_Percentage) || 0) : 0;
    var netAmount = Math.round((baseAmount * (1 - discountPct / 100)) * 100) / 100;

    var cycleCalc = computeAdjustedCycleEndDate(
      payload.billingCycleStartDate,
      config.Billing_Interval_Days,
      payload.studentId,
      allLeaves,
      allPriorInvoices
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
function getPublicOnboardingContext(isDemoMode) {
  try {
    var hubId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_CORE_HUB_ID : GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID;
    var hubSS = SpreadsheetApp.openById(hubId);
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
    var financeId = formData.isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_FINANCIALS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID;
    var financeSS = SpreadsheetApp.openById(financeId);
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
function getOnboardingApplications(isDemoMode) {
  try {
    var financeId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_FINANCIALS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID;
    var financeSS = SpreadsheetApp.openById(financeId);
    var sheet = financeSS.getSheetByName("Onboarding_Pipeline");
    if (!sheet) return { success: false, error: "Onboarding_Pipeline tab not found." };
    var data = parseSheetToObjects(sheet.getDataRange().getValues());
    data.reverse();
    return JSON.parse(JSON.stringify({ success: true, applications: data }));
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
//get the screenshot of the payment
/**
 * Writes a clickable link to the uploaded payment screenshot into the
 * Transaction_Reference_Token column of the matching Onboarding_Pipeline row.
 */
function attachPaymentProofLink(applicationId, fileUrl, isDemoMode) {
  try {
    var financeId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_FINANCIALS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID;
    var financeSS = SpreadsheetApp.openById(financeId);
    var sheet = financeSS.getSheetByName("Onboarding_Pipeline");
    if (!sheet) return { success: false, error: "Onboarding_Pipeline tab not found." };

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idIdx = headers.indexOf("Application_ID");
    var tokenIdx = headers.indexOf("Transaction_Reference_Token");
    if (idIdx === -1 || tokenIdx === -1) return { success: false, error: "Required columns not found." };

    for (var r = 1; r < data.length; r++) {
      if (String(data[r][idIdx]) === String(applicationId)) {
        sheet.getRange(r + 1, tokenIdx + 1).setFormula('=HYPERLINK("' + fileUrl + '", "View Payment Screenshot")');
        return { success: true };
      }
    }
    return { success: false, error: "Application not found." };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
function updateApplicationStatus(applicationId, newStatus, staffEmail, isDemoMode) {
  try {
    var financeId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_FINANCIALS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID;
    var financeSS = SpreadsheetApp.openById(financeId);
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
          var promotionResult = promoteApplicationToStudent(applicationId, staffEmail, isDemoMode);
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
//delete the document 
<<<<<<< HEAD
function deleteEntityDocument(fileId, staffEmail) {
=======
function deleteEntityDocument(fileId, staffEmail, isDemoMode) {
>>>>>>> 8f1241a (demo moded add)
  try {
    try {
      var file = DriveApp.getFileById(fileId);
      file.setTrashed(true);
    } catch (fileErr) {
      // Continue even if the Drive file is already missing
    }

<<<<<<< HEAD
    var financeSS = SpreadsheetApp.openById(GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID);
=======
    var financeId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_FINANCIALS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID;
    var financeSS = SpreadsheetApp.openById(financeId);
>>>>>>> 8f1241a (demo moded add)
    var sheet = financeSS.getSheetByName("Document_Vault_Registry");
    if (!sheet) return { success: false, error: "Document_Vault_Registry tab not found." };

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var fileIdIdx = headers.indexOf("Google_Drive_File_ID");
    if (fileIdIdx === -1) return { success: false, error: "Google_Drive_File_ID column not found in sheet." };

    for (var r = 1; r < data.length; r++) {
      if (String(data[r][fileIdIdx]) === String(fileId)) {
        sheet.deleteRow(r + 1);
        return { success: true };
      }
    }

    return { success: false, error: "Document record not found in registry." };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
<<<<<<< HEAD
=======
//delete onboadung
/**
 * Permanently deletes an application row from Onboarding_Pipeline.
 * Does NOT delete any student record that may have been created if the
 * application was previously Approved — that's a separate, deliberate action.
 * Admin/Administrative_Manager only.
 */
function deleteApplication(applicationId, staffEmail, isDemoMode) {
  try {
    var hubId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_CORE_HUB_ID : GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID;
    var hubSS = SpreadsheetApp.openById(hubId);
    var staffSheet = hubSS.getSheetByName("Staff_Registry");
    var staffObjects = parseSheetToObjects(staffSheet.getDataRange().getValues());
    var currentStaff = staffObjects.find(function(s) {
      return s.Email_Address && s.Email_Address.toString().toLowerCase().trim() === (staffEmail || "").toLowerCase().trim();
    });
    var permissions = getRolePermissions(currentStaff ? currentStaff.Role_Type : "");

    if (!permissions.canManageApplications) {
      return { success: false, error: "You do not have permission to delete applications." };
    }

    var financeId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_FINANCIALS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID;
    var financeSS = SpreadsheetApp.openById(financeId);
    var sheet = financeSS.getSheetByName("Onboarding_Pipeline");
    if (!sheet) return { success: false, error: "Onboarding_Pipeline tab not found." };

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idIdx = headers.indexOf("Application_ID");
    if (idIdx === -1) return { success: false, error: "Application_ID column not found." };

    for (var r = 1; r < data.length; r++) {
      if (String(data[r][idIdx]) === String(applicationId)) {
        sheet.deleteRow(r + 1);
        return { success: true };
      }
    }

    return { success: false, error: "Application not found." };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
>>>>>>> 8f1241a (demo moded add)
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
function promoteApplicationToStudent(applicationId, staffEmail, isDemoMode) {
  try {
    var financeId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_FINANCIALS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID;
    var financeSS = SpreadsheetApp.openById(financeId);
    var onboardingSheet = financeSS.getSheetByName("Onboarding_Pipeline");
    var applications = parseSheetToObjects(onboardingSheet.getDataRange().getValues());
    var app = applications.find(function(a) { return String(a.Application_ID) === String(applicationId); });

    if (!app) return { success: false, error: "Application not found for promotion." };

    var hubId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_CORE_HUB_ID : GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID;
    var hubSS = SpreadsheetApp.openById(hubId);
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
//update the student details
function updateApplicationDetails(payload) {
  try {
    var financeId = payload.isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_FINANCIALS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID;
    var financeSS = SpreadsheetApp.openById(financeId);
    var sheet = financeSS.getSheetByName("Onboarding_Pipeline");
    if (!sheet) return { success: false, error: "Onboarding_Pipeline tab not found." };

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idIdx = headers.indexOf("Application_ID");
    var firstNameIdx = headers.indexOf("Player_First_Name");
    var lastNameIdx = headers.indexOf("Player_Last_Name");
    var centerIdx = headers.indexOf("Target_Center_ID");
    var batchIdx = headers.indexOf("Target_Batch_ID");
    var parentNameIdx = headers.indexOf("Parent_Name");
    var parentEmailIdx = headers.indexOf("Parent_Email");
    var parentPhoneIdx = headers.indexOf("Parent_Phone");
    var kitShirtIdx = headers.indexOf("Kit_Shirt");
    var kitShortsIdx = headers.indexOf("Kit_Shorts");
    var medicalIdx = headers.indexOf("Medical_Alert_Flags");

    var matchedApp = null;

    for (var r = 1; r < data.length; r++) {
      if (String(data[r][idIdx]) === String(payload.applicationId)) {
        var rowNum = r + 1;
        if (firstNameIdx !== -1) sheet.getRange(rowNum, firstNameIdx + 1).setValue(payload.firstName || "");
        if (lastNameIdx !== -1) sheet.getRange(rowNum, lastNameIdx + 1).setValue(payload.lastName || "");
        if (centerIdx !== -1) sheet.getRange(rowNum, centerIdx + 1).setValue(payload.centerId || "");
        if (batchIdx !== -1) sheet.getRange(rowNum, batchIdx + 1).setValue(payload.batchId || "");
        if (parentNameIdx !== -1) sheet.getRange(rowNum, parentNameIdx + 1).setValue(payload.parentName || "");
        if (parentEmailIdx !== -1) sheet.getRange(rowNum, parentEmailIdx + 1).setValue(payload.parentEmail || "");
        if (parentPhoneIdx !== -1) sheet.getRange(rowNum, parentPhoneIdx + 1).setValue(payload.parentPhone || "");
        if (kitShirtIdx !== -1) sheet.getRange(rowNum, kitShirtIdx + 1).setValue(payload.kitShirt || "");
        if (kitShortsIdx !== -1) sheet.getRange(rowNum, kitShortsIdx + 1).setValue(payload.kitShorts || "");
        if (medicalIdx !== -1) sheet.getRange(rowNum, medicalIdx + 1).setValue(payload.medicalAlerts || "None");

        matchedApp = data[r];
        break;
      }
    }

    if (!matchedApp) return { success: false, error: "Application not found." };

    // 🌟 Also sync the corresponding Academy_Roster row, if this application was already promoted to a student
    try {
      var hubId = payload.isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_CORE_HUB_ID : GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID;
      var hubSS = SpreadsheetApp.openById(hubId);
      var rosterSheet = hubSS.getSheetByName("Academy_Roster");
      var rosterData = rosterSheet.getDataRange().getValues();
      var rosterHeaders = rosterData[0];

      var rFirstIdx = rosterHeaders.indexOf("First_Name");
      var rLastIdx = rosterHeaders.indexOf("Last_Name");
      var rParentEmailIdx = rosterHeaders.indexOf("Parent_Email");
      var rParentNameIdx = rosterHeaders.indexOf("Parent_Name");
      var rParentPhoneIdx = rosterHeaders.indexOf("Parent_Phone");
      var rCenterIdx = rosterHeaders.indexOf("Academy_Center_ID");
      var rBatchIdx = rosterHeaders.indexOf("Academy_Batch_ID");
      var rKitShirtIdx = rosterHeaders.indexOf("Kit_Size_Shirt");
      var rKitShortsIdx = rosterHeaders.indexOf("Kit_Size_Shorts");
      var rMedicalIdx = rosterHeaders.indexOf("Medical_Alert_Flags");

      // Match roster row by original parent email (stable identifier across both sheets)
      var originalParentEmail = matchedApp[parentEmailIdx];

      for (var rr = 1; rr < rosterData.length; rr++) {
        if (String(rosterData[rr][rParentEmailIdx]).toLowerCase().trim() === String(originalParentEmail).toLowerCase().trim()) {
          var rosterRowNum = rr + 1;
          if (rFirstIdx !== -1) rosterSheet.getRange(rosterRowNum, rFirstIdx + 1).setValue(payload.firstName || "");
          if (rLastIdx !== -1) rosterSheet.getRange(rosterRowNum, rLastIdx + 1).setValue(payload.lastName || "");
          if (rParentNameIdx !== -1) rosterSheet.getRange(rosterRowNum, rParentNameIdx + 1).setValue(payload.parentName || "");
          if (rParentEmailIdx !== -1) rosterSheet.getRange(rosterRowNum, rParentEmailIdx + 1).setValue(payload.parentEmail || "");
          if (rParentPhoneIdx !== -1) rosterSheet.getRange(rosterRowNum, rParentPhoneIdx + 1).setValue(payload.parentPhone || "");
          if (rCenterIdx !== -1) rosterSheet.getRange(rosterRowNum, rCenterIdx + 1).setValue(payload.centerId || "");
          if (rBatchIdx !== -1) rosterSheet.getRange(rosterRowNum, rBatchIdx + 1).setValue(payload.batchId || "");
          if (rKitShirtIdx !== -1) rosterSheet.getRange(rosterRowNum, rKitShirtIdx + 1).setValue(payload.kitShirt || "");
          if (rKitShortsIdx !== -1) rosterSheet.getRange(rosterRowNum, rKitShortsIdx + 1).setValue(payload.kitShorts || "");
          if (rMedicalIdx !== -1) rosterSheet.getRange(rosterRowNum, rMedicalIdx + 1).setValue(payload.medicalAlerts || "None");
          break;
        }
      }
    } catch (rosterSyncError) {
      // Roster sync failing shouldn't block the application update itself — log and continue
      Logger.log("Roster sync failed: " + rosterSyncError.toString());
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
//verification of the documnets

<<<<<<< HEAD
function updateDocumentVerificationStatus(fileId, newStatus, staffEmail, isAdmin) {
=======
function updateDocumentVerificationStatus(fileId, newStatus, staffEmail, isAdmin, isDemoMode) {
>>>>>>> 8f1241a (demo moded add)
  try {
    if (!isAdmin) {
      return { success: false, error: "Only Admin Directors can verify documents." };
    }

<<<<<<< HEAD
    var financeSS = SpreadsheetApp.openById(GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID);
=======
    var financeId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_FINANCIALS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID;
    var financeSS = SpreadsheetApp.openById(financeId);
>>>>>>> 8f1241a (demo moded add)
    var sheet = financeSS.getSheetByName("Document_Vault_Registry");
    if (!sheet) return { success: false, error: "Document_Vault_Registry tab not found." };

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var fileIdIdx = headers.indexOf("Google_Drive_File_ID");
    var statusIdx = headers.indexOf("Verification_Status");
    if (fileIdIdx === -1 || statusIdx === -1) return { success: false, error: "Required columns not found." };

    for (var r = 1; r < data.length; r++) {
      if (String(data[r][fileIdIdx]) === String(fileId)) {
        sheet.getRange(r + 1, statusIdx + 1).setValue(newStatus);
        return { success: true, newStatus: newStatus };
      }
    }

    return { success: false, error: "Document record not found." };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
// ========================================================================
// 🏖️ APPROVED LEAVE REGISTRY — SLIDING MILESTONE ENGINE UI


/**
 * Submits a new leave request with Approval_Status = "Pending".
 * payload: { studentId, breakStartDate, breakEndDate, leaveReason, staffEmail }
 */
function submitLeaveRequest(payload) {
  try {
    var financeId = payload.isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_FINANCIALS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID;
    var financeSS = SpreadsheetApp.openById(financeId);
    var sheet = financeSS.getSheetByName("Approved_Leave_Registry");
    if (!sheet) return { success: false, error: "Approved_Leave_Registry tab not found." };

    var start = new Date(payload.breakStartDate);
    var end = new Date(payload.breakEndDate);
    if (end < start) return { success: false, error: "End date cannot be before start date." };

    var totalDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    var tz = GLOBAL_SYSTEM_CONFIG.GLOBAL_TIMEZONE;
    var leaveId = "LV-" + new Date().getTime();

    var row = [
      leaveId,
      payload.studentId,
      Utilities.formatDate(start, tz, "yyyy-MM-dd"),
      Utilities.formatDate(end, tz, "yyyy-MM-dd"),
      totalDays,
      payload.leaveReason || "",
      "Pending",
      payload.staffEmail || ""
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
function updateLeaveStatus(leaveId, newStatus, staffEmail, isDemoMode) {
  try {
<<<<<<< HEAD
=======
    var hubId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_CORE_HUB_ID : GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID;
    var hubSS = SpreadsheetApp.openById(hubId);
    var staffSheet = hubSS.getSheetByName("Staff_Registry");
    var staffObjects = parseSheetToObjects(staffSheet.getDataRange().getValues());
    var currentStaff = staffObjects.find(function(s) {
      return s.Email_Address && s.Email_Address.toString().toLowerCase().trim() === (staffEmail || "").toLowerCase().trim();
    });
    var permissions = getRolePermissions(currentStaff ? currentStaff.Role_Type : "");

    if (!permissions.canApproveLeave) {
      return { success: false, error: "Permission denied: you are not authorized to approve or reject leave requests." };
    }

>>>>>>> 8f1241a (demo moded add)
    var financeId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_FINANCIALS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID;
    var financeSS = SpreadsheetApp.openById(financeId);
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

function getLeaveRequests(isDemoMode) {
  try {
    var financeId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_FINANCIALS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID;
    var financeSS = SpreadsheetApp.openById(financeId);
    var sheet = financeSS.getSheetByName("Approved_Leave_Registry");
    if (!sheet) return { success: false, error: "Approved_Leave_Registry tab not found." };

    var data = parseSheetToObjects(sheet.getDataRange().getValues());
    data.reverse();
    return JSON.parse(JSON.stringify({ success: true, leaves: data }));
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
function getOrCreateSubfolder(parentFolder, subfolderName) {
  var folders = parentFolder.getFoldersByName(subfolderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return parentFolder.createFolder(subfolderName);
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

    var financeId = payload.isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_FINANCIALS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID;
    var financeSS = SpreadsheetApp.openById(financeId);
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

    return { success: true, docId: docId, fileId: file.getId(), fileUrl: file.getUrl() };
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
function getDocumentsForEntity(entityId, isDemoMode) {
  try {
    var financeId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_FINANCIALS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID;
    var financeSS = SpreadsheetApp.openById(financeId);
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
    var financeId = payload.isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_FINANCIALS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID;
    var financeSS = SpreadsheetApp.openById(financeId);
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
    var financeId = payload.isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_FINANCIALS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID;
    var financeSS = SpreadsheetApp.openById(financeId);
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

function deleteInvoice(invoiceId, staffEmail, isDemoMode) {
  try {
    var financeId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_FINANCIALS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID;
    var financeSS = SpreadsheetApp.openById(financeId);
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
function deleteFeeConfig(feeConfigId, staffEmail, isDemoMode) {
  try {
    var financeId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_FINANCIALS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID;
    var financeSS = SpreadsheetApp.openById(financeId);
    var sheet = financeSS.getSheetByName("Fee_Configuration_Matrix");
    if (!sheet) return { success: false, error: "Fee_Configuration_Matrix tab not found." };
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idIdx = headers.indexOf("Config_ID");
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

function deleteDiscount(discountId, staffEmail, isDemoMode) {
  try {
    var financeId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_FINANCIALS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID;
    var financeSS = SpreadsheetApp.openById(financeId);
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

/**
 * Safely formats a date value that may come back as either a clean string
 * or an auto-converted Date object from the sheet, into "dd MMM yyyy".
 */
function formatInvoiceDate(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, GLOBAL_SYSTEM_CONFIG.GLOBAL_TIMEZONE, "dd MMM yyyy");
  }
  return value; // already a clean string
}
function generateInvoicePDF(invoiceId, isDemoMode) {
  try {
    var financeId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_FINANCIALS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID;
    var hubId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_CORE_HUB_ID : GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID;
    var financeSS = SpreadsheetApp.openById(financeId);
    var invoiceSheet = financeSS.getSheetByName("Billing_Ledger_Invoices");
    var hubSS = SpreadsheetApp.openById(hubId);
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
    <div class="row"><span class="label">Billing Period</span><span class="value">${formatInvoiceDate(inv.Billing_Cycle_Start_Date)} → ${formatInvoiceDate(inv.Billing_Cycle_End_Date)}</span></div>
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

// function TEMP_authorizeMailSending() {
//   MailApp.sendEmail({
//     to: "kempintern01@gmail.com",
//     subject: "Test — Authorization Check",
//     htmlBody: "If you received this, MailApp permission is now granted."
//   });
// }
/**
 * Sends a single payment reminder email to the parent of the given invoice.
 */
function sendPaymentReminderEmail(invoiceId, isDemoMode) {
  try {
    var financeId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_FINANCIALS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID;
    var hubId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_CORE_HUB_ID : GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID;

    var financeSS = SpreadsheetApp.openById(financeId);
    var invoiceSheet = financeSS.getSheetByName("Billing_Ledger_Invoices");
    var invoices = parseSheetToObjects(invoiceSheet.getDataRange().getValues());
    var invoice = invoices.find(function(i) { return String(i.Invoice_ID) === String(invoiceId); });
    if (!invoice) return { success: false, error: "Invoice not found." };

    var hubSS = SpreadsheetApp.openById(hubId);
    var rosterSheet = hubSS.getSheetByName("Academy_Roster");
    var roster = parseSheetToObjects(rosterSheet.getDataRange().getValues());
    var student = roster.find(function(s) { return String(s.Student_ID) === String(invoice.Student_ID); });
    if (!student) return { success: false, error: "Student record not found for this invoice." };
    if (!student.Parent_Email) return { success: false, error: "No Parent_Email on file for this student." };

    var branding = getBrandingConfig("default");
    var balance = (Number(invoice.Total_Due) || 0) - (Number(invoice.Amount_Paid) || 0);

    var result = dispatchReminderEmail(student, invoice, balance, branding);
    return result;
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Sends payment reminders to every currently Unpaid / Partially_Paid invoice.
 * Returns a summary so the admin can see what happened.
 */
function sendBulkPaymentReminders(isDemoMode) {
  try {
    var financeId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_FINANCIALS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID;
    var hubId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_CORE_HUB_ID : GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID;

    var financeSS = SpreadsheetApp.openById(financeId);
    var invoiceSheet = financeSS.getSheetByName("Billing_Ledger_Invoices");
    var invoices = parseSheetToObjects(invoiceSheet.getDataRange().getValues());

    var hubSS = SpreadsheetApp.openById(hubId);
    var rosterSheet = hubSS.getSheetByName("Academy_Roster");
    var roster = parseSheetToObjects(rosterSheet.getDataRange().getValues());

    var branding = getBrandingConfig("default");

    var unpaid = invoices.filter(function(inv) {
      return inv.Payment_Status === "Unpaid" || inv.Payment_Status === "Partially_Paid";
    });

    var sentCount = 0;
    var skipped = [];

    unpaid.forEach(function(invoice) {
      var student = roster.find(function(s) { return String(s.Student_ID) === String(invoice.Student_ID); });
      if (!student || !student.Parent_Email) {
        skipped.push(invoice.Invoice_ID + " (no parent email on file)");
        return;
      }
      var balance = (Number(invoice.Total_Due) || 0) - (Number(invoice.Amount_Paid) || 0);
      var result = dispatchReminderEmail(student, invoice, balance, branding);
      if (result.success) sentCount++;
      else skipped.push(invoice.Invoice_ID + " (" + result.error + ")");
    });

    return { success: true, sentCount: sentCount, totalUnpaid: unpaid.length, skipped: skipped };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Shared helper: builds and sends the branded HTML reminder email.
 */
function dispatchReminderEmail(student, invoice, balance, branding) {
  try {
    var playerName = (student.First_Name || "") + " " + (student.Last_Name || "");
    var parentName = student.Parent_Name || "Parent/Guardian";

    // Format dates cleanly (e.g. "01 Aug 2026") instead of raw Date.toString() output.
    function formatCleanDate(dateValue) {
      if (!dateValue) return "";
      var d = (dateValue instanceof Date) ? dateValue : new Date(dateValue);
      if (isNaN(d.getTime())) return String(dateValue); // fallback if it's not a valid date
      return Utilities.formatDate(d, GLOBAL_SYSTEM_CONFIG.GLOBAL_TIMEZONE, "dd MMM yyyy");
    }

    var formattedStartDate = formatCleanDate(invoice.Billing_Cycle_Start_Date);
    var formattedEndDate = formatCleanDate(invoice.Billing_Cycle_End_Date);

    var subject = branding.Academy_Name + " — Payment Reminder for " + playerName.trim();

    var htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: ${branding.Color_Light};">
        <div style="text-align:center; margin-bottom:20px;">
          ${branding.Logo_URL ? `<img src="${branding.Logo_URL}" alt="${branding.Academy_Name}" style="max-height:48px; margin-bottom:8px;">` : ''}
          <h2 style="color:${branding.Color_Primary}; margin:0;">${branding.Academy_Name}</h2>
        </div>
        <div style="background:white; border-radius:12px; padding:20px; border:1px solid ${branding.Color_Border};">
          <p style="font-size:14px; color:#334155;">Dear ${parentName},</p>
          <p style="font-size:14px; color:#334155; line-height:1.6;">
            This is a reminder that a payment is due for <strong>${playerName.trim()}</strong>.
          </p>
          <div style="background:${branding.Color_Light}; border-radius:8px; padding:14px; margin:16px 0; font-size:14px; color:#1e293b;">
            <div>Invoice: <strong>${invoice.Invoice_ID}</strong></div>
            <div>Billing Period: <strong>${formattedStartDate} → ${formattedEndDate}</strong></div>
            <div style="margin-top:8px; font-size:16px;">Amount Due: <strong style="color:${branding.Color_Primary};">₹${balance.toFixed(2)}</strong></div>
          </div>
          <p style="font-size:13px; color:#64748b; line-height:1.6;">
            Please arrange payment at your earliest convenience. If you've already paid, kindly disregard this message.
          </p>
        </div>
        <p style="text-align:center; font-size:11px; color:#94a3b8; margin-top:16px;">
          ${branding.Academy_Name} Management Suite
        </p>
      </div>
    `;

    MailApp.sendEmail({
      to: student.Parent_Email,
      subject: subject,
      htmlBody: htmlBody
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
//for permission
function getRolePermissions(roleType) {
  var role = (roleType || "").trim();

  var isAdmin = (role === "Director" || role === "Admin");
  var isAdminManager = (role === "Administrative_Manager");
  var isAccounts = (role === "Accounts");
  var isHeadCoach = (role === "Head_Coach");

  return {
    isAdmin: isAdmin,
    canManageStaff: isAdmin || isAdminManager,
    canManageApplications: isAdmin || isAdminManager,
    canManageFeeConfig: isAdmin || isAccounts,
    canManageDiscounts: isAdmin,  // ← Admin only, unlike Fee Config
    canViewInvoices: isAdmin || isAdminManager || isAccounts,
    canGenerateInvoice: isAdmin || isAdminManager || isAccounts,
    canApproveLeave: isAdmin || isAdminManager || isHeadCoach,
    canUseDemoToggle: isAdmin,
    roleType: role
  };
}
// ========================================================================
// 🧑‍💼 STAFF BOARD — STAFF REGISTRY MANAGEMENT ENGINE
// ========================================================================

/**
 * Loads all data needed for the Staff Board: staff list + centers for assignment.
 */
function getStaffBoardContext(isDemoMode, staffEmail) {
  try {
    var hubId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_CORE_HUB_ID : GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID;
    var currentUserEmail = staffEmail || Session.getActiveUser().getEmail();

    var hubSS = SpreadsheetApp.openById(hubId);
    var staffValues = hubSS.getSheetByName("Staff_Registry").getDataRange().getValues();
    var facilityValues = hubSS.getSheetByName("Facilities_Matrix").getDataRange().getValues();

    var staffObjects = parseSheetToObjects(staffValues);

    var currentStaff = staffObjects.find(function(s) {
      return s.Email_Address && s.Email_Address.toString().toLowerCase().trim() === currentUserEmail.toLowerCase().trim();
    });

    var permissions = getRolePermissions(currentStaff ? currentStaff.Role_Type : "");

    return JSON.parse(JSON.stringify({
      success: true,
      staff: staffObjects,
      facilities: parseSheetToObjects(facilityValues),
      isAdmin: permissions.isAdmin,
      permissions: permissions
    }));
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Generates the next sequential Staff_ID (e.g. STF-001, STF-002...)
 */
function generateNextStaffId(existingStaff) {
  var maxNum = 0;
  existingStaff.forEach(function(s) {
    var match = String(s.Staff_ID || "").match(/STF-(\d+)/);
    if (match) {
      var num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  var nextNum = maxNum + 1;
  var padded = ("000" + nextNum).slice(-3);
  return "STF-" + padded;
}

/**
 * Adds a new staff member to Staff_Registry.
 * payload: { fullName, email, roleType, centerId, grantAppAccess: ["eval","attendance","billing"], staffEmail }
 */
function addStaffMember(payload) {
  try {
    var hubId = payload.isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_CORE_HUB_ID : GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID;
    var hubSS = SpreadsheetApp.openById(hubId);
    var sheet = hubSS.getSheetByName("Staff_Registry");
    if (!sheet) return { success: false, error: "Staff_Registry tab not found." };

    var existingStaff = parseSheetToObjects(sheet.getDataRange().getValues());
    var normalizedEmail = (payload.email || "").toLowerCase().trim();

    var alreadyExists = existingStaff.some(function(s) {
      return s.Email_Address && s.Email_Address.toString().toLowerCase().trim() === normalizedEmail;
    });
    if (alreadyExists) {
      return { success: false, error: "A staff member with this email already exists." };
    }

    var newStaffId = generateNextStaffId(existingStaff);

    sheet.appendRow([
      newStaffId,
      payload.fullName || "",
      normalizedEmail,
      payload.roleType || "",
      payload.centerId || "",
      "Active"
    ]);

    // Optionally provision login access via IAM_Registry
    if (payload.grantAppAccess && payload.grantAppAccess.length > 0) {
      provisionIAMAccess(normalizedEmail, payload.grantAppAccess);
    }

    return { success: true, staffId: newStaffId };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
<<<<<<< HEAD
=======
/**
 * Returns the current list of app scopes (e.g. ["eval","attendance"]) for a given email,
 * so the Edit Staff modal can pre-check the right boxes.
 */

>>>>>>> 8f1241a (demo moded add)
/**
 * Edits an existing staff member's Full_Name, Role_Type, Assigned_Center_ID.
 * payload: { staffId, fullName, roleType, centerId }
 */
function updateStaffMember(payload) {
  try {
    var hubId = payload.isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_CORE_HUB_ID : GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID;
    var hubSS = SpreadsheetApp.openById(hubId);
    var sheet = hubSS.getSheetByName("Staff_Registry");
    if (!sheet) return { success: false, error: "Staff_Registry tab not found." };

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idIdx = headers.indexOf("Staff_ID");
    var nameIdx = headers.indexOf("Full_Name");
    var roleIdx = headers.indexOf("Role_Type");
    var centerIdx = headers.indexOf("Assigned_Center_ID");
    var emailIdx = headers.indexOf("Email_Address");

    for (var r = 1; r < data.length; r++) {
      if (String(data[r][idIdx]) === String(payload.staffId)) {
        sheet.getRange(r + 1, nameIdx + 1).setValue(payload.fullName || "");
        sheet.getRange(r + 1, roleIdx + 1).setValue(payload.roleType || "");
        sheet.getRange(r + 1, centerIdx + 1).setValue(payload.centerId || "");

        // Update login access to exactly match the selected checkboxes (supports promotions/demotions)
        if (payload.grantAppAccess) {
          var staffEmail = data[r][emailIdx];
          setIAMAccessExact(staffEmail, payload.grantAppAccess);
        }

        return { success: true };
      }
    }
    return { success: false, error: "Staff member not found." };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Toggles a staff member's Status between Active and Terminated.
 */
function updateStaffStatus(staffId, newStatus, staffEmail, isDemoMode) {
  try {
    var hubId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_CORE_HUB_ID : GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID;
    var hubSS = SpreadsheetApp.openById(hubId);
    var sheet = hubSS.getSheetByName("Staff_Registry");
    if (!sheet) return { success: false, error: "Staff_Registry tab not found." };

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idIdx = headers.indexOf("Staff_ID");
    var statusIdx = headers.indexOf("Status");

    for (var r = 1; r < data.length; r++) {
      if (String(data[r][idIdx]) === String(staffId)) {
        sheet.getRange(r + 1, statusIdx + 1).setValue(newStatus);
        return { success: true };
      }
    }
    return { success: false, error: "Staff member not found." };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Admin-only hard delete of a staff row (e.g. entered by mistake).
 * Prefer updateStaffStatus('Terminated') for real departures — this keeps no audit trail.
 */
function deleteStaffMember(staffId, staffEmail, isDemoMode) {
  try {
    var hubId = isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_CORE_HUB_ID : GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID;
    var hubSS = SpreadsheetApp.openById(hubId);
    var sheet = hubSS.getSheetByName("Staff_Registry");
    if (!sheet) return { success: false, error: "Staff_Registry tab not found." };

    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var idIdx = headers.indexOf("Staff_ID");

    for (var r = 1; r < data.length; r++) {
      if (String(data[r][idIdx]) === String(staffId)) {
        sheet.deleteRow(r + 1);
        return { success: true };
      }
    }
    return { success: false, error: "Staff member not found." };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Grants a staff member login access to one or more apps by creating/updating
 * their IAM_Registry row. New rows start with a blank password (self-registration
 * on first login), matching the existing State-A onboarding flow.
 * appScopesArray e.g. ["eval","attendance","billing","staff"]
 */
function provisionIAMAccess(email, appScopesArray) {
  try {
    var vaultId = GLOBAL_SYSTEM_CONFIG.CONFIG_IAM_MASTER_ID;
    var sheet = SpreadsheetApp.openById(vaultId).getSheetByName("IAM_Registry");
    var data = sheet.getDataRange().getValues();
    var normalizedEmail = email.toLowerCase().trim();
    var newScopesString = appScopesArray.join(",");

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase().trim() === normalizedEmail) {
        // Row exists — merge in any newly granted scopes without wiping existing ones
        var existingScopes = String(data[i][3] || "").split(",").map(function(s){ return s.trim(); }).filter(Boolean);
        appScopesArray.forEach(function(scope) {
          if (existingScopes.indexOf(scope) === -1) existingScopes.push(scope);
        });
        sheet.getRange(i + 1, 4).setValue(existingScopes.join(","));
        sheet.getRange(i + 1, 2).setValue("Active"); // ensure not Suspended
        return { success: true, updated: true };
      }
    }

    // No row yet — create one with blank password (triggers self-registration)
    sheet.appendRow([normalizedEmail, "Active", "", newScopesString, ""]);
    return { success: true, created: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
function isValidHexColor(value) {
  return typeof value === "string" && /^#[0-9A-Fa-f]{6}$/.test(value.trim());
}

function getBrandingConfig(academyId) {
  var fallback = {
    Academy_ID: "default",
    Academy_Name: "KEMP FC",
    Logo_URL: "",
    Color_Primary: "#cc0000",
    Color_Dark: "#1e293b",
    Color_Light: "#f8fafc",
    Color_Border: "#cbd5e1",
    Color_Blue: "#0288d1",
    Color_Success: "#16a34a"
  };

  try {
    var hubSS = SpreadsheetApp.openById(GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID);
    var sheet = hubSS.getSheetByName("Branding_Config");
    if (!sheet) return fallback;

    var rows = parseSheetToObjects(sheet.getDataRange().getValues());
    var targetId = academyId || "default";
    var match = rows.find(function(r) { return String(r.Academy_ID).toLowerCase() === targetId.toLowerCase(); });

    if (!match) return fallback;

    // Validate every color field individually — fall back to Kemp's value if malformed
    var colorFields = ["Color_Primary", "Color_Dark", "Color_Light", "Color_Border", "Color_Blue", "Color_Success"];
    colorFields.forEach(function(field) {
      if (!isValidHexColor(match[field])) {
        match[field] = fallback[field];
      }
    });

    return match;
  } catch (e) {
    return fallback;
  }
}
<<<<<<< HEAD
=======
/**
 * Returns the current list of app scopes (e.g. ["eval","attendance"]) for a given email,
 * so the Edit Staff modal can pre-check the right boxes.
 */
function getIAMAccessForEmail(email) {
  try {
    var vaultId = GLOBAL_SYSTEM_CONFIG.CONFIG_IAM_MASTER_ID;
    var sheet = SpreadsheetApp.openById(vaultId).getSheetByName("IAM_Registry");
    var data = sheet.getDataRange().getValues();
    var normalizedEmail = (email || "").toLowerCase().trim();

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase().trim() === normalizedEmail) {
        return String(data[i][3] || "").split(",").map(function(s){ return s.trim(); }).filter(Boolean);
      }
    }
    return []; // no IAM row yet — no access granted
  } catch (error) {
    return [];
  }
}
/**
 * Sets a staff member's app access to exactly the given scopes (replaces, does not merge).
 * Used by Edit Staff so removing a checkbox actually revokes that access.
 */
function setIAMAccessExact(email, appScopesArray) {
  try {
    var vaultId = GLOBAL_SYSTEM_CONFIG.CONFIG_IAM_MASTER_ID;
    var sheet = SpreadsheetApp.openById(vaultId).getSheetByName("IAM_Registry");
    var data = sheet.getDataRange().getValues();
    var normalizedEmail = (email || "").toLowerCase().trim();
    var newScopesString = (appScopesArray || []).join(",");

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).toLowerCase().trim() === normalizedEmail) {
        sheet.getRange(i + 1, 4).setValue(newScopesString);
        return { success: true, updated: true };
      }
    }

    // No row yet — create with blank password (self-registration on first login)
    sheet.appendRow([normalizedEmail, "Active", "", newScopesString, ""]);
    return { success: true, created: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
>>>>>>> 8f1241a (demo moded add)
function getCustomSessionColumns(sessionName, isDemoMode) {
  try {
    var ss = SpreadsheetApp.openById(
      isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_EVALUATIONS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_EVALUATIONS_ID
    );
    var sheet = ss.getSheetByName(sessionName);
    if (!sheet) return [];
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    return headers.filter(function(h) { return h !== ''; });
  } catch(e) {
    return [];
  }
}

function saveCustomSessionEntry(sessionName, rowData, coachEmail, isDemoMode) {
  try {
    var ss = SpreadsheetApp.openById(
      isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_EVALUATIONS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_EVALUATIONS_ID
    );
    var sheet = ss.getSheetByName(sessionName);
    Logger.log("Session name received: " + sessionName);
    if (!sheet) return { success: false, error: "Session sheet not found." };

    // Read existing headers (row 1)
    var lastCol = sheet.getLastColumn();
    var headers = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];

    // Make sure the required identity columns exist, in the right order,
    // followed by any custom columns already present, followed by anything
    // new in rowData that isn't a header yet.
    var requiredFirst = ['TX_Signature_Token', 'Player_Name', 'Trial_Number_Or_Bib'];

    var missingRequired = requiredFirst.filter(function(h) { return headers.indexOf(h) === -1; });

    var incomingKeys = Object.keys(rowData);
    var missingFromIncoming = incomingKeys.filter(function(k) {
      return headers.indexOf(k) === -1 && requiredFirst.indexOf(k) === -1;
    });

    var headersChanged = false;

    // If the sheet is brand new (no headers at all), build the full header row.
    if (headers.length === 0) {
      headers = requiredFirst.concat(missingFromIncoming);
      headersChanged = true;
    } else {
      // Insert any missing required columns at the front (only if truly missing)
      if (missingRequired.length > 0) {
        headers = requiredFirst.concat(headers.filter(function(h) { return requiredFirst.indexOf(h) === -1; }));
        headersChanged = true;
      }
      // Append any new custom columns not yet tracked
      if (missingFromIncoming.length > 0) {
        headers = headers.concat(missingFromIncoming);
        headersChanged = true;
      }
    }

    if (headersChanged) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }

    var row = headers.map(function(h) { return rowData[h] || ''; });
    sheet.appendRow(row);

    return { success: true };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}

//app custom
function getAllCustomSessions(isDemoMode) {
  try {
    var ss = SpreadsheetApp.openById(
      isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_EVALUATIONS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_EVALUATIONS_ID
    );
    var sheets = ss.getSheets();
    return sheets
      .map(function(s) { return s.getName(); })
      .filter(function(name) { return name.startsWith('CUSTOM_'); });
  } catch(e) {
    return [];
  }
}

function addColumnsToExistingSession(sessionName, newColumns, isDemoMode) {
  try {
    var PROTECTED_COLUMNS = ['TX_Signature_Token', 'Player_Name', 'Trial_Number_Or_Bib'];
    var blocked = newColumns.filter(function(c) { return PROTECTED_COLUMNS.indexOf(c) !== -1; });
    if (blocked.length > 0) {
      return { success: false, error: "These column names are reserved: " + blocked.join(', ') };
    }

    var ss = SpreadsheetApp.openById(
      isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_EVALUATIONS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_EVALUATIONS_ID
    );
    
    var sheet = ss.getSheetByName(sessionName);
    if (!sheet) return { success: false, error: "Session not found." };

    var lastCol = sheet.getLastColumn();
    var newHeaders = newColumns;
    
    // Add new column headers
    sheet.getRange(1, lastCol + 1, 1, newHeaders.length).setValues([newHeaders]);

    return { success: true };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}
function removeColumnFromSession(sessionName, colName, isDemoMode) {
  try {
    var PROTECTED_COLUMNS = ['TX_Signature_Token', 'Player_Name', 'Trial_Number_Or_Bib'];
    if (PROTECTED_COLUMNS.indexOf(colName) !== -1) {
      return { success: false, error: "This column is required and cannot be removed." };
    }

    var ss = SpreadsheetApp.openById(
      isDemoMode ? GLOBAL_SYSTEM_CONFIG.DEMO_SPOKE_EVALUATIONS_ID : GLOBAL_SYSTEM_CONFIG.SPOKE_EVALUATIONS_ID
    );
    var sheet = ss.getSheetByName(sessionName);
    if (!sheet) return { success: false, error: "Session not found." };

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var colIndex = headers.indexOf(colName);
    if (colIndex === -1) return { success: false, error: "Column not found." };

    sheet.deleteColumn(colIndex + 1);
    return { success: true };
  } catch(e) {
    return { success: false, error: e.toString() };
  }
}
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}