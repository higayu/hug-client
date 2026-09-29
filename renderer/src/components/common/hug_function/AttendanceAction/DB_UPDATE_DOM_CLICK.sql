-- 入退室ルールを「関数直接実行」ではなく「HUG実DOMボタンclick」に統一
UPDATE web_automation_rules
SET action_type = 'click',
    parser_type = 'dom-click',
    function_name = NULL,
    config_json = JSON_SET(
      COALESCE(config_json, JSON_OBJECT()),
      '$.execute', 'dom-click',
      '$.delegateSiteJavascript', true,
      '$.detectMailDialog', true,
      '$.mailDialogSelector', '#addtend_dialog_mail',
      '$.mailDialogButtonSelector', '.send_mail_button[data-send_mail="{{sendMail}}"]',
      '$.mailDialogTimeoutMs', 3000,
      '$.mailDialogPollIntervalMs', 25
    ),
    version = version + 1
WHERE rule_key IN (
  'attendance_enter_no_mail',
  'attendance_enter_with_mail',
  'attendance_leave_no_mail',
  'attendance_leave_with_mail'
);

UPDATE web_automation_flow_steps
SET config_json = JSON_SET(
      COALESCE(config_json, JSON_OBJECT()),
      '$.executor', 'dom-click',
      '$.detectMailDialog', true
    ),
    step_key = CASE
      WHEN step_key LIKE '%enter%' THEN 'click_enter_button'
      WHEN step_key LIKE '%leave%' THEN 'click_leave_button'
      ELSE step_key
    END,
    name = CASE
      WHEN step_key LIKE '%enter%' THEN 'HUG本体 入室ボタンDOMクリック'
      WHEN step_key LIKE '%leave%' THEN 'HUG本体 退室ボタンDOMクリック'
      ELSE name
    END
WHERE id IN (31, 32, 33, 34);

UPDATE web_automation_flows
SET config_json = JSON_SET(
      COALESCE(config_json, JSON_OBJECT()),
      '$.executor', 'dom-click',
      '$.detectMailDialog', true,
      '$.mailDialogSelector', '#addtend_dialog_mail'
    ),
    version = version + 1
WHERE flow_key IN (
  'attendance_enter_no_mail',
  'attendance_enter_with_mail',
  'attendance_leave_no_mail',
  'attendance_leave_with_mail'
);
