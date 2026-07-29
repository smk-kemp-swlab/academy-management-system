/**
 * AUTOMATED ECOSYSTEM ORCHESTRATION ENGINE
 * Execution Mode: Run once at initial deployment setup phase.
 * Core Function: Programmatically deploys spoke workbooks and maps center configurations.
 */
function runInitialEcosystemSetup() {
  try {
    var rootFolder = DriveApp.getFolderById(GLOBAL_SYSTEM_CONFIG.VAULT_ROOT_FOLDER_ID);
    var hubSpreadsheet = SpreadsheetApp.openById(GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID);
    
    Logger.log("=== CONNECTED TO WORKING DATA DOMAIN ===");
    
    // 1. Initialize Core HUB Sheet Directory Layouts
    var rosterSheet = hubSpreadsheet.getActiveSheet().setName("Academy_Roster");
    var staffSheet = hubSpreadsheet.insertSheet("Staff_Registry");
    var facilitiesSheet = hubSpreadsheet.insertSheet("Facilities_Matrix");
    var batchesSheet = hubSpreadsheet.insertSheet("Batches_Registry");
    
    // Inject Definitive Database Column Key Headers
    rosterSheet.appendRow(["Student_ID", "First_Name", "Last_Name", "DOB", "Parent_Name", "Parent_Email", "Parent_Phone", "Academy_Center_ID", "Academy_Batch_ID", "Kit_Size_Shirt", "Kit_Size_Shorts", "Medical_Alert_Flags", "Onboarding_Date", "Status"]);
    staffSheet.appendRow(["Staff_ID", "Full_Name", "Email_Address", "Role_Type", "Assigned_Center_ID", "Status"]);
    facilitiesSheet.appendRow(["Center_ID", "Center_Name", "City_Region", "Static_IP_Gateway", "Geographic_City_Boundary_Token"]);
    batchesSheet.appendRow(["Batch_ID", "Center_ID", "Batch_Name", "Scheduled_Days", "Target_Age_Group"]);
    
    // Format Header Styles for clean sheet auditing
    [rosterSheet, staffSheet, facilitiesSheet, batchesSheet].forEach(function(sh) {
      sh.getRange(1, 1, 1, sh.getLastColumn()).setFontWeight("bold").setBackground("#f3f3f3");
    });
    
    // 2. Inject Your Four Specific Core Centers into the Registry Matrix
    facilitiesSheet.appendRow(["CTR_WHITEFIELD", "Whitefield Center", "Bengaluru", "", "Bengaluru"]);
    facilitiesSheet.appendRow(["CTR_VELOCT", "VeloCT Center", "Bengaluru", "", "Bengaluru"]);
    facilitiesSheet.appendRow(["CTR_GAW", "GAW Center", "Bengaluru", "", "Bengaluru"]);
    facilitiesSheet.appendRow(["CTR_GAS", "GAS Center", "Bengaluru", "", "Bengaluru"]);
    
    // Seed Sample Age Batches across your centers for dynamic interface dropdown validation
    batchesSheet.appendRow(["B_WF_U14", "CTR_WHITEFIELD", "Whitefield Under 14 Elite", "Mon/Wed/Fri", "U14"]);
    batchesSheet.appendRow(["B_VCT_U12", "CTR_VELOCT", "VeloCT Under 12 Dev", "Tue/Thu", "U12"]);
    batchesSheet.appendRow(["B_GAW_U17", "CTR_GAW", "GAW Under 17 Tournament", "Sat/Sun", "U17"]);
    batchesSheet.appendRow(["B_GAS_U10", "CTR_GAS", "GAS Under 10 Grassroots", "Tue/Thu/Sat", "U10"]);
    
    // Seed Active Admin Identity so your current Google account passes initialization rules
    staffSheet.appendRow(["STF-001", "Primary System Admin", Session.getActiveUser().getEmail(), "Director", "ALL", "Active"]);
    
    Logger.log("=== HUB DIRECTORY MAPPED ===");
    
    // 3. Create Separate SPOKE Transaction Workbooks inside your Shared Drive
    var spokeEvaluations = SpreadsheetApp.create("Spoke_Evaluations_DataWarehouse");
    var spokeAttendance = SpreadsheetApp.create("Spoke_Attendance_Ledger");
    var spokeFinancials = SpreadsheetApp.create("Spoke_Financials_Billing");
    
    // Explicitly organize newly generated spoke workbooks into your shared vault folder
    [spokeEvaluations, spokeAttendance, spokeFinancials].forEach(function(spokeObj) {
      var fileObj = DriveApp.getFileById(spokeObj.getId());
      rootFolder.addFile(fileObj);
      DriveApp.getRootFolder().removeFile(fileObj); // Remove from general Drive root
    });
    
    // Build Base Tables for Operations Attendance Spoke Workbook
    var staffAttnSheet = spokeAttendance.getActiveSheet().setName("Staff_Attendance_Log");
    var studentAttnSheet = spokeAttendance.insertSheet("Student_Attendance_Log");
    staffAttnSheet.appendRow(["Log_ID", "Staff_ID", "Full_Name", "Role_Type", "Timestamp", "Action_Type", "Network_IP_Address", "ISP_Provider_Token", "Captured_City_Region", "Location_Status_Flag"]);
    studentAttnSheet.appendRow(["Log_ID", "Date_Timestamp", "Center_ID", "Batch_ID", "Student_ID", "Status", "Logged_By_Staff_ID"]);
    
    staffAttnSheet.getRange(1, 1, 1, 10).setFontWeight("bold").setBackground("#eef2f7");
    studentAttnSheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#eef2f7");
    
    // Build Base Tables for Subscription Financials Spoke Workbook
    var configFeeSheet = spokeFinancials.getActiveSheet().setName("Fee_Configuration_Matrix");
    var discountSheet = spokeFinancials.insertSheet("Discount_Registry");
    var leaveSheet = spokeFinancials.insertSheet("Approved_Leave_Registry");
    var invoiceSheet = spokeFinancials.insertSheet("Billing_Ledger_Invoices");
    var pipelineSheet = spokeFinancials.insertSheet("Onboarding_Pipeline");
    var vaultRegSheet = spokeFinancials.insertSheet("Document_Vault_Registry");
    
    configFeeSheet.appendRow(["Config_ID", "Center_ID", "Age_Group", "Program_Type", "Billing_Interval_Days", "Base_Fee_Amount", "Kit_Fee_Amount", "Registration_Fee_Amount"]);
    discountSheet.appendRow(["Discount_ID", "Discount_Name", "Discount_Percentage"]);
    leaveSheet.appendRow(["Leave_ID", "Student_ID", "Break_Start_Date", "Break_End_Date", "Total_Break_Days", "Leave_Reason", "Approval_Status", "Authorized_By_Staff_ID"]);
    invoiceSheet.appendRow(["Invoice_ID", "Student_ID", "Billing_Cycle_Start_Date", "Billing_Cycle_End_Date", "Base_Amount", "Discount_Applied_ID", "Calculated_Net_Amount", "Late_Fee_Amount", "Late_Fee_Status", "Total_Due", "Amount_Paid", "Payment_Status", "Payment_Date", "Payment_Mode", "Transaction_Reference_No", "Logged_By_Staff_ID", "Waiver_Reason_Notes"]);
    pipelineSheet.appendRow(["Application_ID", "Submission_Timestamp", "Target_Center_ID", "Target_Batch_ID", "Player_First_Name", "Player_Last_Name", "Player_DOB", "Parent_Name", "Parent_Email", "Parent_Phone", "Kit_Shirt", "Kit_Shorts", "Medical_Alert_Flags", "Selected_Payment_Strategy", "Transaction_Reference_Token", "Review_Status", "Processed_By_Staff_ID"]);
    vaultRegSheet.appendRow(["Doc_ID", "Entity_ID", "Document_Type", "Google_Drive_File_ID", "Secure_View_URL", "Verification_Status", "Uploaded_Timestamp"]);
    
    [configFeeSheet, discountSheet, leaveSheet, invoiceSheet, pipelineSheet, vaultRegSheet].forEach(function(fsh) {
      fsh.getRange(1, 1, 1, fsh.getLastColumn()).setFontWeight("bold").setBackground("#fff2cc");
    });
    
    Logger.log("\n========================================================");
    Logger.log("PROVISIONING COMPLETE. COPY THESE GENERATED KEYS:");
    Logger.log("SPOKE_EVALUATIONS_ID: " + spokeEvaluations.getId());
    Logger.log("SPOKE_ATTENDANCE_ID: " + spokeAttendance.getId());
    Logger.log("SPOKE_FINANCIALS_ID: " + spokeFinancials.getId());
    Logger.log("========================================================");
    
  } catch (err) {
    Logger.log("ORCHESTRATION ENGINE FAULT CRASH: " + err.toString());
  }
}

/**
 * REFINED ROSTER DATA MIGRATION UTILITY (WITH STRICT DD-MM-YYYY DATE PARSING)
 */
function migrateExistingStudentRoster() {
  try {
    var hubSS = SpreadsheetApp.openById(GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID);
    var targetRosterSheet = hubSS.getSheetByName("Academy_Roster");
    var rawSourceSheet = hubSS.getSheetByName("Raw_Import_Data");
    
    if (!rawSourceSheet) {
      Logger.log("MIGRATION ABORTED: Could not find a tab named 'Raw_Import_Data'. Please create it and add your source records.");
      return;
    }
    
    var rawValues = rawSourceSheet.getDataRange().getValues();
    if (rawValues.length <= 1) {
      Logger.log("MIGRATION ABORTED: The 'Raw_Import_Data' tab is empty or only contains header rows.");
      return;
    }
    
    var sourceHeaders = rawValues[0];
    var lastRosterRow = targetRosterSheet.getLastRow();
    var idSequenceCounter = 1;
    
    if (lastRosterRow > 1) {
      var lastLoggedIdString = targetRosterSheet.getRange(lastRosterRow, 1).getValue().toString();
      var extractedNumericInt = parseInt(lastLoggedIdString.replace("ACA-", ""), 10);
      if (!isNaN(extractedNumericInt)) {
        idSequenceCounter = extractedNumericInt + 1;
      }
    }
    
    var outputBatchRows = [];
    var backupTodayDate = Utilities.formatDate(new Date(), GLOBAL_SYSTEM_CONFIG.GLOBAL_TIMEZONE || "GMT", "yyyy-MM-dd");
    
    var idxFirst   = sourceHeaders.indexOf("First_Name");
    var idxLast    = sourceHeaders.indexOf("Last_Name");
    var idxDob     = sourceHeaders.indexOf("DOB");
    var idxPName   = sourceHeaders.indexOf("Parent_Name");
    var idxPEmail  = sourceHeaders.indexOf("Parent_Email");
    var idxPPhone  = sourceHeaders.indexOf("Parent_Phone");
    var idxCenter  = sourceHeaders.indexOf("Center_ID");
    var idxBatch   = sourceHeaders.indexOf("Batch_ID");
    var idxShirt   = sourceHeaders.indexOf("Kit_Shirt");
    var idxShorts  = sourceHeaders.indexOf("Kit_Shorts");
    var idxMedical = sourceHeaders.indexOf("Medical_Alerts");
    var idxJoining = sourceHeaders.indexOf("Date_Of_Joining");
    
    for (var r = 1; r < rawValues.length; r++) {
      var currentRow = rawValues[r];
      if (!currentRow[idxFirst] && !currentRow[idxLast]) continue;
      
      var generatedIdString = "ACA-" + idSequenceCounter.toString().padStart(3, '0');
      
      var formattedDob = "";
      if (currentRow[idxDob]) {
        formattedDob = parseRegionalDateStringToISO(currentRow[idxDob]);
      }
      
      var formattedJoiningDate = backupTodayDate;
      if (idxJoining !== -1 && currentRow[idxJoining]) {
        var parsedJoining = parseRegionalDateStringToISO(currentRow[idxJoining]);
        if (parsedJoining) formattedJoiningDate = parsedJoining;
      }
      
      var newRosterRow = [
        generatedIdString,
        currentRow[idxFirst].toString().trim(),
        currentRow[idxLast].toString().trim(),
        formattedDob,
        currentRow[idxPName] ? currentRow[idxPName].toString().trim() : "",
        currentRow[idxPEmail] ? currentRow[idxPEmail].toString().trim() : "",
        currentRow[idxPPhone] ? currentRow[idxPPhone].toString().trim() : "",
        currentRow[idxCenter] ? currentRow[idxCenter].toString().trim() : "UNASSIGNED",
        currentRow[idxBatch] ? currentRow[idxBatch].toString().trim() : "UNASSIGNED",
        currentRow[idxShirt] ? currentRow[idxShirt].toString().trim() : "M",
        currentRow[idxShorts] ? currentRow[idxShorts].toString().trim() : "M",
        currentRow[idxMedical] ? currentRow[idxMedical].toString().trim() : "None",
        formattedJoiningDate,
        "Active" 
      ];
      
      outputBatchRows.push(newRosterRow);
      idSequenceCounter++;
    }
    
    if (outputBatchRows.length > 0) {
      targetRosterSheet.getRange(targetRosterSheet.getLastRow() + 1, 1, outputBatchRows.length, outputBatchRows[0].length).setValues(outputBatchRows);
      Logger.log("MIGRATION SUCCESSFUL: Loaded " + outputBatchRows.length + " player records cleanly into the master hub ledger!");
      
      // Fixed cache clearance key to perfectly map production infrastructure updates
      var cache = CacheService.getScriptCache();
      cache.remove("perf_context_payload_PROD");
    }
    
  } catch (err) {
    Logger.log("MIGRATION ENGINE FAULT: " + err.toString());
  }
}

/**
 * INTERNAL UTILITY: TEXT STRIPPER AND DATE CONVERTOR
 */
function parseRegionalDateStringToISO(dateInput) {
  if (!dateInput) return "";
  if (dateInput instanceof Date) {
    return Utilities.formatDate(dateInput, GLOBAL_SYSTEM_CONFIG.GLOBAL_TIMEZONE || "GMT", "yyyy-MM-dd");
  }
  
  var dateStr = dateInput.toString().trim();
  var parts = dateStr.split(/[-/]/); 
  
  if (parts.length === 3) {
    var day = parts[0].padStart(2, '0');
    var month = parts[1].padStart(2, '0');
    var year = parts[2];
    if (year.length === 2) year = "20" + year; 
    return year + "-" + month + "-" + day;
  }
  return dateStr;
}

/**
 * INFRASTRUCTURE AS CODE: AUTOMATED SANDBOX PROVISIONING ENGINE
 */
function initializeSandboxEnvironment() {
  const SANDBOX_FOLDER_ID = "1cOAhfwcUdiutdvAFpjPts38wczgayN2C"; 
  const PROD_CONFIG = {
    hub: GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID,
    evals: GLOBAL_SYSTEM_CONFIG.SPOKE_EVALUATIONS_ID,
    attendance: GLOBAL_SYSTEM_CONFIG.SPOKE_ATTENDANCE_ID,
    financials: GLOBAL_SYSTEM_CONFIG.SPOKE_FINANCIALS_ID
  };

  try {
    Logger.log("STARTING SANDBOX PROVISIONING...");
    var targetFolder = DriveApp.getFolderById(SANDBOX_FOLDER_ID);
    var scriptProperties = PropertiesService.getScriptProperties();
    
    // File 1: DEMO Master Hub
    var prodHub = SpreadsheetApp.openById(PROD_CONFIG.hub);
    var demoHubFile = DriveApp.getFileById(PROD_CONFIG.hub).makeCopy("DEMO_Master_Hub", targetFolder);
    var demoHubId = demoHubFile.getId();
    var demoHubSS = SpreadsheetApp.openById(demoHubId);
    
    var hubTabs = demoHubSS.getSheets();
    for (var i = 0; i < hubTabs.length; i++) {
      var sheet = hubTabs[i];
      if (sheet.getLastRow() > 1) {
        sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
      }
    }
    Logger.log("✓ DEMO_Master_Hub created and cleared of production data.");

    var rosterSheet = demoHubSS.getSheetByName("Academy_Roster");
    if (rosterSheet) {
      rosterSheet.appendRow(["ACA-DEMO01", "Test", "Player Alpha", "2016-01-01", "Parent Alpha", "alpha@test.com", "9999988888", "CTR_WHITEFIELD", "B_WF_U11", "M", "M", "None", "2026-01-01", "Active"]);
      rosterSheet.appendRow(["ACA-DEMO02", "Demo", "Player Beta", "2014-06-15", "Parent Beta", "beta@test.com", "8888877777", "CTR_VELOCT", "B_VCT_O11", "L", "L", "None | Jersey #10", "2026-02-15", "Active"]);
      Logger.log("✓ Mock testing players seeded into sandbox roster.");
    }

    var prodBatchValues = prodHub.getSheetByName("Batches_Registry").getDataRange().getValues();
    var demoBatchSheet = demoHubSS.getSheetByName("Batches_Registry");
    if (demoBatchSheet && prodBatchValues.length > 1) {
      demoBatchSheet.getRange(1, 1, prodBatchValues.length, prodBatchValues[0].length).setValues(prodBatchValues);
    }
    
    var prodFacilityValues = prodHub.getSheetByName("Facilities_Matrix").getDataRange().getValues();
    var demoFacilitySheet = demoHubSS.getSheetByName("Facilities_Matrix");
    if (demoFacilitySheet && prodFacilityValues.length > 1) {
      demoFacilitySheet.getRange(1, 1, prodFacilityValues.length, prodFacilityValues[0].length).setValues(prodFacilityValues);
    }
    
    var prodStaffValues = prodHub.getSheetByName("Staff_Registry").getDataRange().getValues();
    var demoStaffSheet = demoHubSS.getSheetByName("Staff_Registry");
    if (demoStaffSheet && prodStaffValues.length > 1) {
      demoStaffSheet.getRange(1, 1, prodStaffValues.length, prodStaffValues[0].length).setValues(prodStaffValues);
    }
    Logger.log("✓ System configuration matrices mapped into sandbox core.");

    // Files 2-4: Spoke Deployments with absolute root directory sanitation checks
    var demoEvalsId = createCleanHeaderReplicaFile(PROD_CONFIG.evals, "DEMO_Spoke_Evaluations", targetFolder);
    Logger.log("✓ DEMO_Spoke_Evaluations created with matching header structures.");

    var demoAttendanceId = createCleanHeaderReplicaFile(PROD_CONFIG.attendance, "DEMO_Spoke_Attendance", targetFolder);
    Logger.log("✓ DEMO_Spoke_Attendance created with matching header structures.");

    var demoFinancialsId = createCleanHeaderReplicaFile(PROD_CONFIG.financials, "DEMO_Spoke_Financials", targetFolder);
    Logger.log("✓ DEMO_Spoke_Financials created with matching header structures.");

    scriptProperties.setProperty("DEMO_CORE_HUB_ID", demoHubId);
    scriptProperties.setProperty("DEMO_SPOKE_EVALUATIONS_ID", demoEvalsId);
    scriptProperties.setProperty("DEMO_SPOKE_ATTENDANCE_ID", demoAttendanceId);
    scriptProperties.setProperty("DEMO_SPOKE_FINANCIALS_ID", demoFinancialsId);
    
    Logger.log("=================================================================");
    Logger.log("PROVISIONING COMPLETE! COPY THESE IDS FOR STEP 4 IN CODE.GS:");
    Logger.log("=================================================================");
    Logger.log("DEMO_CORE_HUB_ID: " + demoHubId);
    Logger.log("DEMO_SPOKE_EVALUATIONS_ID: " + demoEvalsId);
    Logger.log("DEMO_SPOKE_ATTENDANCE_ID: " + demoAttendanceId);
    Logger.log("DEMO_SPOKE_FINANCIALS_ID: " + demoFinancialsId);
    Logger.log("=================================================================");

  } catch (error) {
    Logger.log("PROVISIONING ENGINE ENCOUNTERED AN ERROR: " + error.toString());
  }
  // Force-evict the stale demo snapshot so the server reads the new manual row corrections
CacheService.getScriptCache().remove("perf_context_payload_DEMO");
Logger.log("🧹 Cached sandbox data evicted successfully. Next load will be live.");
}

/**
 * UTILITY: HELPER TO CLONE STRUCTURES WITHOUT THE DATA ROWS (Saves exclusively to Target Folder)
 */
function createCleanHeaderReplicaFile(sourceFileId, targetFileName, targetFolder) {
  var sourceSS = SpreadsheetApp.openById(sourceFileId);
  var targetCopy = DriveApp.getFileById(sourceFileId).makeCopy(targetFileName, targetFolder);
  
  // Strict environmental isolation: unbinds shortcuts from generic root directories instantly
  try {
    DriveApp.getRootFolder().removeFile(targetCopy);
  } catch(e) {
    // Graceful exception skip if workspace drive structures default directly to folder boundaries
  }
  
  var targetSS = SpreadsheetApp.openById(targetCopy.getId());
  var sheets = targetSS.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var sheet = sheets[i];
    if (sheet.getLastRow() > 1) {
      sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
    }
  }
  return targetSS.getId();
}