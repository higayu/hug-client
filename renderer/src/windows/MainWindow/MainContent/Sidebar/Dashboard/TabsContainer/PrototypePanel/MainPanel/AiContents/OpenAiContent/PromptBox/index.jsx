// renderer/src/Sidebar/NomalMode/Dashboard/TabsContainer/SelectChildren/AiContents/OpenAiContent/PromptBox/index.js
import PersonalRecordPrompt from "../../parts/PersonalRecordPrompt";
import ProfessionalPrompt1 from "../../parts/ProfessionalPrompt1";
import ProfessionalPrompt2 from "../../parts/ProfessionalPrompt2";
import OpenAiTabButton from "@/components/common/AI/OpenAiTabButton";

export const AI_PROMPT_COMPONENT_MAP = {
  personal: {
    label: "個人",
    component: (props) => (
      <PersonalRecordPrompt
        {...props}
        aiName="ChatGPT"
        showTabButton={<OpenAiTabButton />}
      />
    ),
  },
  professional1: {
    label: "専門的支援1",
    component: (props) => (
      <ProfessionalPrompt1
        {...props}
        aiName="ChatGPT"
        showSupportCheck={true}
      />
    ),
  },
  professional2: {
    label: "専門的支援2",
    component: (props) => (
      <ProfessionalPrompt2
        {...props}
        aiName="ChatGPT"
        buttonLabel="ChatGPT実行"
      />
    ),
  },
};