const {
  fetchPersonalRecordDetails,
} = await require('./fetch');

module.exports = async function executePersonalRecordDetailFetch({
  input,
  helpers,
  config,
}) {
  const result = await fetchPersonalRecordDetails({
    input,
    helpers,
    config,
  });

  if (result?.ok === false) {
    throw new Error(
      result?.error || '個人記録詳細の取得に失敗しました。'
    );
  }

  return result;
};
