const { fetchProfessionalSupportAttendance } = await require("./fetch");
module.exports = async function ({ input, helpers, config }) {
  return await fetchProfessionalSupportAttendance({ input, helpers, config });
};
