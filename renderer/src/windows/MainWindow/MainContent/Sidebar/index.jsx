import { useRef } from "react";

import NormalMode from "./NomalMode";
import AiInquiry from "./AiInquiry";

import { useAppState } from "@/AppStateContext";

function Sidebar() {
  const sidebarRef = useRef(null);

  const {
    IS_DASHBOARD_MODE,
    IS_AI_INQUIRY_MODE,
  } = useAppState();

  return (
    <div
      ref={sidebarRef}
      className="
        flex
        h-full
        flex-col
        bg-gray-50
        text-black
      "
    >
      {IS_DASHBOARD_MODE && (
        <NormalMode />
      )}

      {IS_AI_INQUIRY_MODE && (
        <AiInquiry />
      )}
    </div>
  );
}

export default Sidebar
