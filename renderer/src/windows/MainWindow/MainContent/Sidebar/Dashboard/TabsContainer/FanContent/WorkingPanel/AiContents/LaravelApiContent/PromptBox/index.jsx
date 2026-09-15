// renderer/src/Sidebar/NomalMode/Dashboard/TabsContainer/SelectChildren/AiContents/GeminiContent/PromptBox/index.jsx
import PersonalRecordPrompt from "./parts/PersonalRecordPrompt";
import ProfessionalPrompt1 from "./parts/ProfessionalPrompt1";

export const AI_PROMPT_COMPONENT_MAP = {
  personal: {
    label: "個人",
    component: (props) => (
      <PersonalRecordPrompt
        {...props}
        aiName="Laravel API"
        renderResultArea={props.renderLaravelApiResultArea}
        resultAreaLabel="Laravel API 返却値（個人）"
      />
    ),
  },
  professional1: {
    label: "専門的支援1",
    component: (props) => (
      <ProfessionalPrompt1
        {...props}
        aiName="Laravel API"
        renderResultArea={props.renderLaravelApiResultArea}
        resultAreaLabel="Laravel API 返却値（専門的支援）"
        showSupportCheck={true}
      />
    ),
  },
};