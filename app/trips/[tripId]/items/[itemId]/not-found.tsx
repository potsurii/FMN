import Link from "next/link";
import { Button } from "@/components/foundation/Button";
import { Heading } from "@/components/foundation/Heading";
import { Text } from "@/components/foundation/Text";

export default function ItemNotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 text-center">
      <Heading level={1} className="mb-3">
        未找到商品
      </Heading>
      <Text className="mb-6 text-[var(--color-ink-muted)]">
        该商品不存在，或不属于这次旅行。
      </Text>
      <Link href="/">
        <Button>返回我的旅行</Button>
      </Link>
    </div>
  );
}
