import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripHorizontal } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface WidgetProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  key?: React.Key;
}

function SortableWidget({ id, children, className }: WidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative group ${className || ''}`}>
      <div 
        {...attributes} 
        {...listeners}
        className="absolute top-2 right-2 p-1 rounded-md bg-white/50 dark:bg-black/50 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing z-20 transition-opacity"
      >
        <GripHorizontal className="h-4 w-4 text-zinc-500" />
      </div>
      {children}
    </div>
  );
}

interface DraggableDashboardProps {
  widgets: { id: string; content: React.ReactNode; className?: string }[];
  onReorder?: (newOrder: string[]) => void;
}

export function DraggableDashboard({ widgets: initialWidgets, onReorder }: DraggableDashboardProps) {
  const [widgets, setWidgets] = useState(initialWidgets);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newArray = arrayMove(items, oldIndex, newIndex);
        if (onReorder) {
          onReorder(newArray.map((w: any) => w.id));
        }
        return newArray;
      });
    }
  };

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={widgets.map(w => w.id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {widgets.map((widget) => (
            <SortableWidget key={widget.id} id={widget.id} className={widget.className}>
              {widget.content}
            </SortableWidget>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
