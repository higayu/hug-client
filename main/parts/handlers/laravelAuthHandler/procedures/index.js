// main/parts/handlers/laravelAuthHandler/procedures/index.js

const call =
  require("./call");

const registerFacilityChildren =
  require("./registerFacilityChildren");

const registerManagerAssignment =
  require("./register_manager_assignment");

const syncHugStaffs =
  require("./syncHugStaffs");

const updateStaff =
  require("./update_staff");

const upsertServiceRecord =
  require("./upsertServiceRecord");

const upsertServiceRecordsBulk =
  require("./upsertServiceRecordsBulk");

const getServiceRecordMonthly = require("./get_service_record_monthly");
const syncProfessionalSupportMonth = require("./syncProfessionalSupportMonth");
const getProfessionalSupportMonth = require("./getProfessionalSupportMonth");
const getChildKadaiGraph = require("./get_child_kadai_graph");
const upsertChildKadaiGraph = require("./upsert_child_kadai_graph");
const deleteChildRecord = require("./delete_child_record");

const getActiveAiPrompt =
  require("./get_active_ai_prompt");

const upsertAiPrompt =
  require("./upsert_ai_prompt");

const upsertManagers2 =
  require("./upsertManagers2");

const upsertTempNotes =
  require("./upsert_temp_notes");

module.exports = {
  // ============================================================
  // 汎用プロシージャ実行
  // ============================================================

  callHandler:
    call.handler,

  // ============================================================
  // 児童・施設・スタッフ関連
  // ============================================================

  registerFacilityChildrenHandler:
    registerFacilityChildren.handler,

  registerManagerAssignmentHandler:
    registerManagerAssignment.handler,

  syncHugStaffsHandler:
    syncHugStaffs.handler,

  updateStaffHandler:
    updateStaff.handler,

  // ============================================================
  // サービス記録
  // ============================================================

  upsertServiceRecordHandler:
    upsertServiceRecord.handler,

  upsertServiceRecordsBulkHandler:
    upsertServiceRecordsBulk.handler,

  getServiceRecordMonthlyHandler:
    getServiceRecordMonthly.handler,

  syncProfessionalSupportMonthHandler:
    syncProfessionalSupportMonth.handler,

  getProfessionalSupportMonthHandler:
    getProfessionalSupportMonth.handler,

  getChildKadaiGraphHandler:
    getChildKadaiGraph.handler,

  upsertChildKadaiGraphHandler:
    upsertChildKadaiGraph.handler,

  deleteChildRecordHandler:
    deleteChildRecord.handler,

  getActiveAiPromptHandler:
    getActiveAiPrompt.handler,

  upsertAiPromptHandler:
    upsertAiPrompt.handler,

  // ============================================================
  // 担当児童
  // ============================================================

  upsertManagers2Handler:
    upsertManagers2.handler,

  // ============================================================
  // 一時メモ
  // ============================================================

  /**
   * modeをpayloadから受け取る共通ハンドラー。
   *
   * mode:
   * - all
   * - memo1
   * - memo2
   */
  upsertTempNotesHandler:
    upsertTempNotes.handler,

  /**
   * memo1・memo2を両方保存する。
   */
  upsertTempNotesAllHandler:
    upsertTempNotes.saveAllHandler,

  /**
   * memo1だけ保存する。
   */
  upsertTempNotesMemo1Handler:
    upsertTempNotes.saveMemo1Handler,

  /**
   * memo2だけ保存する。
   */
  upsertTempNotesMemo2Handler:
    upsertTempNotes.saveMemo2Handler,
};
