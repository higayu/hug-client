const URL_TARGET = 'https://www.hug-ayumu.link/hug/wm/'

export default function ProfessionalSupportWindow() {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
      <div className="flex h-[90vh] w-[95vw] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <section className="flex w-[70%] items-center justify-center border-r border-gray-200">
          <div className="px-8 py-6">
            <h1 className="text-xl font-semibold text-gray-800">
              専門的支援
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              このページには現在機能がありません。
            </p>
          </div>
        </section>

        <section className="relative w-[30%] overflow-hidden">
          <webview
            src={URL_TARGET}
            allowpopups="true"
            disablewebsecurity="true"
            className="absolute inset-0 h-full w-full border-none"
          />
        </section>
      </div>
    </div>
  )
}
