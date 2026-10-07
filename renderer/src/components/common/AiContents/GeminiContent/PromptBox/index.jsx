// renderer/src/Sidebar/NomalMode/Dashboard/TabsContainer/SelectChildren/AiContents/GeminiContent/PromptBox/index.jsx
import PersonalRecordPrompt from "../../parts/PersonalRecordPrompt";
import ProfessionalPrompt1 from "../../parts/ProfessionalPrompt1";
import ProfessionalPrompt2 from "../../parts/ProfessionalPrompt2";

export const AI_PROMPT_COMPONENT_MAP = {
  personal: {
    label: "個人",
    component: (props) => (
      <PersonalRecordPrompt
        {...props}
        aiName="Gemini"
        renderResultArea={props.renderGeminiResultArea}
        resultAreaLabel="Gemini API 返却値（個人）"
      />
    ),
  },
  professional1: {
    label: "専門的支援1",
    component: (props) => (
      <ProfessionalPrompt1
        {...props}
        aiName="Gemini"
        renderResultArea={props.renderGeminiResultArea}
        resultAreaLabel="Gemini API 返却値（専門1）"
        showSupportCheck={true}
      />
    ),
  },
  professional2: {
    label: "専門的支援2",
    component: (props) => (
      <ProfessionalPrompt2
        {...props}
        aiName="Gemini"
        renderResultArea={props.renderGeminiResultArea}
        resultAreaLabel="Gemini API 返却値（専門2）"
        buttonLabel="Gemini実行"
      />
    ),
  },
};