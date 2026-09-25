import type { ReactNode } from "react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { ShoppingTodoCard } from "@/components/todo/ShoppingTodoCard";
import type { ShoppingTodoWithDisplay } from "@/lib/todos/types";

type ShoppingTodoListProps = {
  tripId: string;
  todos: ShoppingTodoWithDisplay[];
  emptyAction?: ReactNode;
  className?: string;
};

export function ShoppingTodoList({
  tripId,
  todos,
  emptyAction,
  className = "",
}: ShoppingTodoListProps) {
  if (todos.length === 0) {
    return (
      <EmptyState
        variant="NoTodoItems"
        action={emptyAction}
        className={className}
      />
    );
  }

  return (
    <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 ${className}`}>
      {todos.map((todo) => (
        <ShoppingTodoCard key={todo.id} todo={todo} tripId={tripId} />
      ))}
    </div>
  );
}
