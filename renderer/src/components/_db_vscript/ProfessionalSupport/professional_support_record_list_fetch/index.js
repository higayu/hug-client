const { fetchProfessionalSupportRecordList } = await require("./fetch");
module.exports = async function ({ input, helpers, config }) {
  return await fetchProfessionalSupportRecordList({ input, helpers, config });
};
