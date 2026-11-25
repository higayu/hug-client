import PersonRecordPlanBtn from './PersonRecordPlanBtn';
import ProfessionalPlanBtn from './ProfessionalPlanBtn';

import PortalDropdown from '@/components/ui/PortalDropdown';
import MonitoringButtton from '@/components/common/MonitoringButtton';

export default function SupportPlanNavigation({
  className = '',
}) {
  return (
    <PortalDropdown
      id="support-plan-menu"
      ariaLabel="支援計画メニュー"
      align="start"
      menuClassName="
        min-w-[200px]
        max-w-[calc(100vw-16px)]
        overflow-hidden
        rounded-md
        border
        border-gray-300
        bg-white
        shadow-lg
      "
      trigger={({
        isOpen,
        triggerRef,
        toggleMenu,
        menuId,
      }) => (
        <nav
          className={`
            relative
            z-[1001]
            ml-0
            inline-block
            min-w-fit
            flex-shrink-0
            ${className}
          `}
          aria-label="支援計画"
        >
          <button
            ref={triggerRef}
            id="panel-support-btn"
            type="button"
            onClick={toggleMenu}
            className="
              relative
              z-[1002]
              cursor-pointer
              whitespace-nowrap
              border-none
              bg-[#1976d2]
              px-3
              py-1.5
              text-white
              transition-colors
              hover:bg-[#2196f3]
              focus:bg-[#2196f3]
              focus:outline-none
            "
            aria-haspopup="menu"
            aria-expanded={isOpen}
            aria-controls={
              isOpen
                ? menuId
                : undefined
            }
          >
            📜支援計画

            <span
              className={`
                ml-1
                inline-block
                text-xs
                transition-transform
                ${
                  isOpen
                    ? 'rotate-180'
                    : ''
                }
              `}
              aria-hidden="true"
            >
              ▾
            </span>
          </button>
        </nav>
      )}
    >
      {({ closeMenu }) => (
        <ul className="m-0 list-none p-0 py-1">
          <li className="m-0 p-0">
            <PersonRecordPlanBtn onOpened={closeMenu} />
          </li>
          <li className="m-0 p-0">
            <ProfessionalPlanBtn onOpened={closeMenu} />
          </li>
          <li className="m-0 p-0">
              <MonitoringButtton />
          </li>
        </ul>
      )}
    </PortalDropdown>
  );
}