// src/components/Sidebar/AiInquiry/VerticalNav/NavItem/index.jsx

export default function NavItem({
  item,
  isActive = false,
  onSelect = () => {},
  buttonClassName = '',
}) {
  const Icon = item.icon;

  const disabled =
    item.disabled ?? false;

  const handleClick = () => {
    if (
      disabled ||
      !item.id
    ) {
      return;
    }

    onSelect(item.id);
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={handleClick}
      className={`
        group
        relative
        mx-2
        flex
        w-auto
        shrink-0
        cursor-pointer
        items-center
        gap-3
        overflow-hidden
        rounded-lg
        border
        px-4
        py-3
        text-left
        transition-all
        duration-200
        ease-out

        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-primary-400
        focus-visible:ring-offset-2
        focus-visible:ring-offset-gray-800

        disabled:cursor-not-allowed
        disabled:opacity-40

        ${
          isActive
            ? `
              border-primary-400
              bg-primary-500
              text-white
              shadow-lg
              shadow-primary-950/40
              ring-1
              ring-inset
              ring-white/20
            `
            : `
              border-transparent
              bg-transparent
              text-gray-200
              hover:border-white/10
              hover:bg-white/10
              hover:text-white
            `
        }

        ${buttonClassName}
      `}
      aria-label={item.label}
      aria-current={
        isActive
          ? 'page'
          : undefined
      }
      title={item.label}
    >
      {isActive && (
        <span
          className="
            absolute
            bottom-2
            left-0
            top-2
            w-1
            rounded-r-full
            bg-white
            shadow-sm
          "
          aria-hidden="true"
        />
      )}

      <span
        className={`
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-lg
          transition-all
          duration-200

          ${
            isActive
              ? `
                bg-white/20
                text-white
                shadow-inner
              `
              : `
                bg-white/5
                text-gray-300
                group-hover:bg-white/10
                group-hover:text-white
              `
          }
        `}
      >
        {Icon && (
          <Icon
            className={`
              h-5
              w-5
              transition-transform
              duration-200

              ${
                isActive
                  ? 'scale-110'
                  : 'group-hover:scale-105'
              }
            `}
            strokeWidth={
              isActive
                ? 2.5
                : 2
            }
            aria-hidden="true"
          />
        )}
      </span>

      <span
        className={`
          min-w-0
          flex-1
          truncate
          text-sm

          ${
            isActive
              ? 'font-bold'
              : 'font-medium'
          }
        `}
      >
        {item.label}
      </span>

      {item.isNew && (
        <span
          className={`
            shrink-0
            rounded-full
            px-2
            py-0.5
            text-[0.6rem]
            font-bold
            tracking-wide

            ${
              isActive
                ? `
                  bg-white
                  text-primary-600
                `
                : `
                  bg-primary-500
                  text-white
                `
            }
          `}
        >
          NEW
        </span>
      )}

      {isActive && (
        <span
          className="
            h-2
            w-2
            shrink-0
            rounded-full
            bg-white
            shadow
            shadow-white/50
          "
          aria-hidden="true"
        />
      )}
    </button>
  );
}