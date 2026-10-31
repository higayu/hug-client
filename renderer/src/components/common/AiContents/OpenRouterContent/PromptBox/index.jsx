// renderer/src/Sidebar/NomalMode/Dashboard/TabsContainer/SelectChildren/AiContents/OpenRouterContent/PromptBox/index.jsx
import PersonalRecordPrompt from "../../common/PersonalRecordPrompt";
import ProfessionalPrompt1 from "../../common/ProfessionalPrompt1";
import ProfessionalPrompt2 from "../../common/ProfessionalPrompt2";

export const AI_PROMPT_COMPONENT_MAP = {
  personal: {
    label: "個人",
    component: (props) => (
      <PersonalRecordPrompt
        {...props}
        aiName="OpenRouter"
        renderResultArea={props.renderOpenRouterResultArea}
        resultAreaLabel="OpenRouter API 返却値（個人）"
      />
    ),
  },
  professional1: {
    label: "専門的支援1",
    component: (props) => (
      <ProfessionalPrompt1
        {...props}
        aiName="OpenRouter"
        renderResultArea={props.renderOpenRouterResultArea}
        resultAreaLabel="OpenRouter API 返却値（専門1）"
        showSupportCheck={true}
      />
    ),
  },
  professional2: {
    label: "専門的支援2",
    component: (props) => (
      <ProfessionalPrompt2
        {...props}
        aiName="OpenRouter"
        renderResultArea={props.renderOpenRouterResultArea}
        resultAreaLabel="OpenRouter API 返却値（専門2）"
        buttonLabel="OpenRouter実行"
      />
    ),
  },
};