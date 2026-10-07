// renderer/src/Sidebar/NomalMode/Dashboard/TabsContainer/SelectChildren/AiContents/OllamaContent/PromptBox/index.jsx
import PersonalRecordPrompt from "../../parts/PersonalRecordPrompt";
import ProfessionalPrompt1 from "../../parts/ProfessionalPrompt1";
import ProfessionalPrompt2 from "../../parts/ProfessionalPrompt2";

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
    label: "専門的支援1",
    component: (props) => (
      <ProfessionalPrompt1
        {...props}
        aiName="Ollama"
        renderResultArea={props.renderOllamaResultArea}
        resultAreaLabel="Ollama API 返却値（専門1）"
        showSupportCheck={true}
      />
    ),
  },
  professional2: {
    label: "専門的支援2",
    component: (props) => (
      <ProfessionalPrompt2
        {...props}
        aiName="Ollama"
        renderResultArea={props.renderOllamaResultArea}
        resultAreaLabel="Ollama API 返却値（専門2）"
        buttonLabel="Ollama実行"
      />
    ),
  },
};