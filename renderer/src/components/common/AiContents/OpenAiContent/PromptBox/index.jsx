// renderer/src/Sidebar/NomalMode/Dashboard/TabsContainer/SelectChildren/AiContents/OpenAiContent/PromptBox/index.js
import PersonalRecordPrompt from "../../common/PersonalRecordPrompt";
import ProfessionalPrompt1 from "../../common/ProfessionalPrompt1";
import OpenAiTabButton from "./OpenAiTabButton";

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
    label: "専門的支援",
    component: (props) => (
      <ProfessionalPrompt1
        {...props}
        aiName="ChatGPT"
        showSupportCheck={true}
      />
    ),
  },

};