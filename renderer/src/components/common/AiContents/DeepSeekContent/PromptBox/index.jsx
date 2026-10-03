// renderer/src/Sidebar/NomalMode/Dashboard/TabsContainer/SelectChildren/AiContents/DeepSeekContent/PromptBox/index.jsx
import PersonalRecordPrompt from "../../parts/PersonalRecordPrompt";
import ProfessionalPrompt1 from "../../parts/ProfessionalPrompt1";
import ProfessionalPrompt2 from "../../parts/ProfessionalPrompt2";
import DeepseekTabButton from "@/components/common/AI/DeepseekTabButton";

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
    label: "専門的支援1",
    component: (props) => (
      <ProfessionalPrompt1
        {...props}
        aiName="DeepSeek"
        showSupportCheck={true}
      />
    ),
  },
  professional2: {
    label: "専門的支援2",
    component: (props) => (
      <ProfessionalPrompt2
        {...props}
        aiName="DeepSeek"
        buttonLabel="DeepSeek実行"
      />
    ),
  },
};