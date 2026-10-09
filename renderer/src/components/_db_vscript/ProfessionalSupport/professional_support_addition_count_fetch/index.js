const { fetchProfessionalSupportAdditionCount } = await require("./fetch");
module.exports = async function ({ input, helpers, config }) {
  return await fetchProfessionalSupportAdditionCount({ input, helpers, config });
};
