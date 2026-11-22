// renderer/src/Sidebar/NomalMode/Dashboard/TabsContainer/SelectChildren/AiContents/DeepSeekContent/PromptBox/index.jsx
import PersonalRecordPrompt from "../../common/PersonalRecordPrompt";
import ProfessionalPrompt1 from "../../common/ProfessionalPrompt1";
import DeepseekTabButton from "./DeepseekTabButton";

export const AI_PROMPT_COMPONENT_MAP = {
  personal: {
    label: "個人",
    component: (props) => (
      <PersonalRecordPrompt
        {...props}
        aiName="DeepSeek"
        showTabButton={<DeepseekTabButton />}
        
      />
    ),
  },
  professional1: {
    label: "専門的支援",
    component: (props) => (
      <ProfessionalPrompt1
        {...props}
        aiName="DeepSeek"
        showSupportCheck={true}
      />
    ),
  },

};