/**
 * TARGETED PIPELINE DIAGNOSTIC: CENTER -> BATCH -> STUDENT
 * Run this function to isolate and test ONLY the cascading dropdown data relationships.
 */
function runTargetedRosterCascadeDiagnostic() {
  Logger.log("======================================================================");
  Logger.log("🎯 RUNNING TARGETED ROSTER CASCADE DIAGNOSTIC");
  Logger.log("======================================================================");

  const TARGET_MODES = [
    { modeName: "PRODUCTION", hubId: GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID },
    { modeName: "SANDBOX / DEMO", hubId: GLOBAL_SYSTEM_CONFIG.DEMO_CORE_HUB_ID }
  ];

  TARGET_MODES.forEach(function(env) {
    Logger.log("\n----------------------------------------------------------------------");
    Logger.log("🔍 TESTING CASCADE LANES IN ENVIRONMENT: [" + env.modeName + "]");
    Logger.log("----------------------------------------------------------------------");

    try {
      var ss = SpreadsheetApp.openById(env.hubId);
      
      var facilitySheet = ss.getSheetByName("Facilities_Matrix");
      var batchSheet = ss.getSheetByName("Batches_Registry");
      var rosterSheet = ss.getSheetByName("Academy_Roster");

      if (!facilitySheet || !batchSheet || !rosterSheet) {
        Logger.log("❌ CRITICAL STRUCTURE FAULT: One or more core tabs are missing.");
        if (!facilitySheet) Logger.log("   - Missing: Facilities_Matrix");
        if (!batchSheet) Logger.log("   - Missing: Batches_Registry");
        if (!rosterSheet) Logger.log("   - Missing: Academy_Roster");
        return;
      }

      // 1. Compile Data Models exactly like Code.gs does
      var facilities = parseSheetToObjects(facilitySheet.getDataRange().getValues());
      var batches = parseSheetToObjects(batchSheet.getDataRange().getValues());
      var players = parseSheetToObjects(rosterSheet.getDataRange().getValues());

      Logger.log("ℹ️ Compiled Counts -> Centers: " + facilities.length + " | Batches: " + batches.length + " | Roster: " + players.length);

      if (facilities.length === 0) {
        Logger.log("⚠️ Aborting: No centers found to simulate selection.");
        return;
      }

      // 2. Simulate Frontend Cascading Selection Loop
      facilities.forEach(function(center) {
        var centerVal = center.Center_ID;
        Logger.log("\n[Step 1] Simulating Selection of Center: '" + center.Center_Name + "' (ID: " + centerVal + ")");

        // Filter Batches (Mimicking HTML line: b.Center_ID === centerVal)
        var matchedBatches = batches.filter(function(b) { return b.Center_ID === centerVal; });
        
        Logger.log("   └── [Step 2] Found " + matchedBatches.length + " matching batch(es) for this Center ID.");

        if (matchedBatches.length === 0) {
          Logger.log("       ❌ CASCADE BREAK: No batches are mapped to Center ID '" + centerVal + "'.");
          return;
        }

        // Trace from each matched batch down to the player population
        matchedBatches.forEach(function(batch) {
          var batchVal = batch.Batch_ID;
          Logger.log("       ├── Batch: '" + batch.Batch_Name + "' (ID: " + batchVal + ")");

          // Filter Players (Mimicking HTML line: p.Academy_Center_ID === centerVal && p.Academy_Batch_ID === batchVal)
          var matchedPlayers = players.filter(function(p) {
            return p.Academy_Center_ID === centerVal && p.Academy_Batch_ID === batchVal;
          });

          Logger.log("       │   └── [Step 3] Found " + matchedPlayers.length + " player(s) mapped to this Center + Batch combination.");

          // Deep Dive check for status configuration splits
          if (matchedPlayers.length > 0) {
            var activePlayers = matchedPlayers.filter(function(p) { return p.Status === "Active"; });
            Logger.log("       │       └── ✅ Active: " + activePlayers.length + " | Inactive/Other: " + (matchedPlayers.length - activePlayers.length));
            
            // Log sample record mapping strings
            Logger.log("       │           Sample Player Row 1 Data: Name='" + matchedPlayers[0].First_Name + " " + matchedPlayers[0].Last_Name + "', Status='" + matchedPlayers[0].Status + "'");
          } else {
            Logger.log("       │       ❌ CASCADE BREAK: Roster contains zero players matching Center '" + centerVal + "' AND Batch '" + batchVal + "'.");
            
            // Helpful Debugging Clue: Look for cross-contamination
            var partialBatchMatch = players.filter(function(p) { return p.Academy_Batch_ID === batchVal; });
            if (partialBatchMatch.length > 0) {
              Logger.log("       │           ⚠️ DATA ANOMALY: Found " + partialBatchMatch.length + " players with Batch_ID '" + batchVal + "', but their Center_ID is listed as '" + partialBatchMatch[0].Academy_Center_ID + "' instead of '" + centerVal + "'.");
            }
          }
        });
      });

    } catch (e) {
      Logger.log("❌ RUNTIME CRASH: " + e.toString());
    }
  });
  
  Logger.log("\n======================================================================");
  Logger.log("🏁 TARGETED CASCADE DIAGNOSTIC COMPLETED CLEAR.");
  Logger.log("======================================================================");
}

/**
 * ======================================================================
 * MASTER ECOSYSTEM-WIDE DATA PIPELINE INTEGRITY AUDIT SUITE
 * ======================================================================
 * Retained here for deep structural environment checks.
 */
function runCompleteEcosystemDiagnostic() {
  Logger.log("======================================================================");
  Logger.log("🚀 INITIALIZING MASTER INTEGRITY AUDIT: KEMP MANAGEMENT ENVIRONMENT");
  Logger.log("======================================================================");

  const TARGET_MODES = [
    { modeName: "PRODUCTION", hubId: GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID },
    { modeName: "SANDBOX / DEMO", hubId: GLOBAL_SYSTEM_CONFIG.DEMO_CORE_HUB_ID }
  ];

  const TARGET_SHEETS = [
    { name: "Staff_Registry", expectedProperties: ["Email_Address"] },
    { name: "Facilities_Matrix", expectedProperties: ["Center_ID", "Center_Name"] },
    { name: "Batches_Registry", expectedProperties: ["Batch_ID", "Center_ID", "Batch_Name"] },
    { name: "Academy_Roster", expectedProperties: ["Student_ID", "Academy_Center_ID", "Academy_Batch_ID", "Status"] }
  ];

  TARGET_MODES.forEach(function(env) {
    Logger.log("\n----------------------------------------------------------------------");
    Logger.log("🌐 ANALYZING ENVIRONMENT DATA LANES: [" + env.modeName + "]");
    Logger.log("----------------------------------------------------------------------");

    if (!env.hubId || env.hubId.trim() === "") {
      Logger.log("❌ CRITICAL DISCONNECT: ID property string is empty or unmapped.");
      return;
    }

    var ss;
    try { ss = SpreadsheetApp.openById(env.hubId); } catch (e) { Logger.log("❌ FILE CRASH ACCESS FAULT: " + e.toString()); return; }

    TARGET_SHEETS.forEach(function(target) {
      Logger.log("\n 📊 Checking Tab Workspace: '" + target.name + "'");
      var sheet = ss.getSheetByName(target.name);
      if (!sheet) { Logger.log("   ❌ SCHEMA FAULT: Tab missing."); return; }

      var rawValues = sheet.getDataRange().getValues();
      var headers = rawValues[0];
      Logger.log("   ℹ️ Row 1 literal headers: " + JSON.stringify(headers));

      var parsedCollection = [];
      var emptyRowCount = 0;
      for (var r = 1; r < rawValues.length; r++) {
        var row = rawValues[r];
        if (row.every(function(c) { return c === null || c.toString().trim() === ""; })) { emptyRowCount++; continue; }
        var obj = {};
        for (var c = 0; c < headers.length; c++) { obj[headers[c]] = row[c]; }
        parsedCollection.push(obj);
      }

      Logger.log("   ℹ️ Matrix Density Scan: Clear Rows = " + parsedCollection.length + " | Phantom Empty Rows = " + emptyRowCount);
      if (parsedCollection.length === 0) return;

      var sampleRecord = parsedCollection[0];
      target.expectedProperties.forEach(function(prop) {
        if (sampleRecord.hasOwnProperty(prop)) {
          Logger.log("   ✅ INSTANCE PROPERTY CLEAR: '" + prop + "' generated. Value trace: '" + sampleRecord[prop] + "'");
        } else {
          Logger.log("   ❌ PROPERTY BREAK DETECTED: Missing '" + prop + "' -> Keys Found: " + JSON.stringify(Object.keys(sampleRecord)));
        }
      });
    });
  });
}
/**
 * STANDALONE PIPELINE SIMULATOR FOR MODE SWITCHING DATA
 * Run this function directly inside the Apps Script Editor to catch server-side crashes.
 */
function runServerSidePayloadAudit() {
  Logger.log("======================================================================");
  Logger.log("🧪 RUNNING SERVER-SIDE SANDBOX DATA PAYLOAD AUDIT");
  Logger.log("======================================================================");
  
  // Test both lanes to identify exactly where the structural crash is happening
  const TEST_LANES = [false, true];
  
  TEST_LANES.forEach(function(isDemo) {
    Logger.log("\n🔄 SIMULATING REQUEST - isDemoMode = " + isDemo);
    
    try {
      // 1. Trace target document routing
      var targetHubId = isDemo ? GLOBAL_SYSTEM_CONFIG.DEMO_CORE_HUB_ID : GLOBAL_SYSTEM_CONFIG.CORE_HUB_ID;
      Logger.log("   👉 Target Spreadsheet ID String: " + targetHubId);
      
      if (!targetHubId) {
        Logger.log("   ❌ CRITICAL FAULT: Spreadsheet ID configuration key is empty.");
        return;
      }
      
      var hubSS = SpreadsheetApp.openById(targetHubId);
      Logger.log("   ✅ Successfully connected to Workbook file: '" + hubSS.getName() + "'");
      
      // 2. Track tab extraction line by line to watch for unhandled structural crashes
      const CORE_TABS = ["Staff_Registry", "Facilities_Matrix", "Batches_Registry", "Academy_Roster"];
      
      CORE_TABS.forEach(function(tabName) {
        var sheet = hubSS.getSheetByName(tabName);
        if (!sheet) {
          Logger.log("   ❌ SCHEMA HARD BREAK: Missing critical tab named '" + tabName + "'");
          return;
        }
        var rowCount = sheet.getLastRow();
        Logger.log("   📊 Tab '" + tabName + "' found clear. Total Rows containing data: " + rowCount);
      });
      
      // 3. Replicate the EXACT data compilation object from getPerformanceEngineContext
      Logger.log("   📦 Executing matrix object compilation factory...");
      
      var staffValues = hubSS.getSheetByName("Staff_Registry").getDataRange().getValues();
      var facilityValues = hubSS.getSheetByName("Facilities_Matrix").getDataRange().getValues();
      var batchValues = hubSS.getSheetByName("Batches_Registry").getDataRange().getValues();
      var rosterValues = hubSS.getSheetByName("Academy_Roster").getDataRange().getValues();
      
      var compiledContext = {
        coaches: parseColumnToFilteredArray(staffValues, "Email_Address"),
        facilities: parseSheetToObjects(facilityValues),
        batches: parseSheetToObjects(batchValues),
        players: parseSheetToObjects(rosterValues),
        isAdmin: true // Forced true for simulation visibility
      };
      
      Logger.log("   ✅ COMPILATION SUCCESSFUL for lane [isDemoMode = " + isDemo + "]");
      Logger.log("      * Filtered Coaches Count: " + compiledContext.coaches.length);
      Logger.log("      * Mapped Centers Count: " + compiledContext.facilities.length);
      Logger.log("      * Mapped Batches Count: " + compiledContext.batches.length);
      Logger.log("      * Mapped Players Count: " + compiledContext.players.length);
      
    } catch (crashException) {
      Logger.log("   💥 SERVER CRASH DETECTED ON THIS LANE!");
      Logger.log("   ❌ Error Description: " + crashException.toString());
      Logger.log("   ❌ Stack Trace Traceback: " + crashException.stack);
    }
  });
  
  Logger.log("\n======================================================================");
  Logger.log("🏁 MASTER PAYLOAD AUDIT COMPLETE.");
  Logger.log("======================================================================");
}