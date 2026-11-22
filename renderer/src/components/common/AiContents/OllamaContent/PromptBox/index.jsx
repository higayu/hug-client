// renderer/src/Sidebar/NomalMode/Dashboard/TabsContainer/SelectChildren/AiContents/OllamaContent/PromptBox/index.jsx
import PersonalRecordPrompt from "../../common/PersonalRecordPrompt";
import ProfessionalPrompt1 from "../../common/ProfessionalPrompt1";

export const AI_PROMPT_COMPONENT_MAP = {
  personal: {
    label: "個人",
    component: (props) => (
      <PersonalRecordPrompt
        {...props}
        aiName="Ollama"
        renderResultArea={props.renderOllamaResultArea}
        resultAreaLabel="Ollama API 返却値（個人）"
      />
    ),
  },
  professional1: {
    label: "専門的支援",
    component: (props) => (
      <ProfessionalPrompt1
        {...props}
        aiName="Ollama"
        renderResultArea={props.renderOllamaResultArea}
        resultAreaLabel="Ollama API 返却値（専門的支援）"
        showSupportCheck={true}
      />
    ),
  },

};