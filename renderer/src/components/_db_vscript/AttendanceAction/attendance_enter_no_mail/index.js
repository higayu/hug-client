const {
  executeAttendanceAction,
} = await require("./action");

module.exports =
  async function execute({
    input,
    helpers,
    config,
    flow,
  }) {
    const result =
      await executeAttendanceAction({
        input,
        helpers,
        config,
      });

    return {
      ...result,
      flowKey:
        flow?.flow_key ||
        null,
    };
  };
