const {
  executeAbsence,
} = await require("./action");

module.exports =
  async function execute({
    input,
    helpers,
    config,
    flow,
  }) {
    const result =
      await executeAbsence({
        input,
        helpers,
        config,
      });

    return {
      ...result,
      flowKey:
        flow?.flow_key ||
        "attendance_absence",
    };
  };
