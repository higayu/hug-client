// renderer/src/components/Sidebar/SQLManager/index.jsx
import UpdateManagerTable from "./UpdateManagerTable";
import { useTabs } from '@/hooks/useTabs/index.js'

function UpdateManager() {
  const { addWebManagerAction } = useTabs()

  return (
    <div className="p-4 flex flex-col h-full bg-white">

      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-blue-600 mb-4">
          児童担当編集
        </h2>
      </div>



      {/* 👇 ここで Table を呼び出す */}
      <div className="flex-1 overflow-auto">
        <UpdateManagerTable />
      </div>
    </div>
  );
}

export default UpdateManager;
