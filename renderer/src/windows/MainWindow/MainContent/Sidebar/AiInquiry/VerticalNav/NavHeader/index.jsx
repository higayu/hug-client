import {
  X,
} from 'lucide-react';

export default function NavHeader() {
  return (
    <header
      className="
        flex
        shrink-0
        items-center
        justify-center
        border-b
        border-white/10
        p-1
      "
    >
      <h2
        className="
          m-0
          text-base
          font-bold
          text-white
        "
      >
        伴走ナビ
      </h2>
    </header>
  );
}