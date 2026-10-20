import React, { useState, useRef, useEffect } from 'react';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import {
  Bucket,
  Goal,
  Idea,
  UserProfile,
} from '../types';
import { IdeaCard } from './IdeaCard';
import { getBucketDetails } from '../utils/colors';
import { Plus, Info } from 'lucide-react';

interface BoardViewProps {
  ideas: Idea[];
  profile: UserProfile;
  goals: Goal[];
  onSelectIdea: (idea: Idea) => void;
  onPinBucket: (ideaId: string, bucket: Bucket | null) => void;
  onStatusChange: (ideaId: string, status: any) => void;
  onRetryAiScoring: (idea: Idea) => void;
  onDeleteIdea: (ideaId: string) => void;
  onOpenQuickCapture: () => void;
  aiEnabled: boolean;
}

interface DraggableIdeaCardProps {
  idea: Idea;
  goals: Goal[];
  onSelect: (idea: Idea) => void;
  onPinBucket: (ideaId: string, bucket: Bucket | null) => void;
  onStatusChange: (ideaId: string, status: any) => void;
  onRetryAiScoring: (idea: Idea) => void;
  onDeleteIdea: (ideaId: string) => void;
  isStale: boolean;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  aiEnabled: boolean;
}

const DraggableIdeaCard: React.FC<DraggableIdeaCardProps> = (props) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: props.idea.id,
    data: { idea: props.idea },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`touch-manipulation ${isDragging ? 'opacity-30' : ''}`}
    >
      <IdeaCard
        idea={props.idea}
        goals={props.goals}
        onSelect={props.onSelect}
        onPinBucket={props.onPinBucket}
        onStatusChange={props.onStatusChange}
        onRetryAiScoring={props.onRetryAiScoring}
        onDeleteIdea={props.onDeleteIdea}
        isStale={props.isStale}
        isMenuOpen={props.isMenuOpen}
        onToggleMenu={props.onToggleMenu}
        onCloseMenu={props.onCloseMenu}
        aiEnabled={props.aiEnabled}
      />
    </div>
  );
};

const DroppableTab: React.FC<{
  bucket: Bucket;
  isSelected: boolean;
  count: number;
  nowHoursSum: number;
  profile: UserProfile;
  onClick: () => void;
}> = ({ bucket, isSelected, count, nowHoursSum, profile, onClick }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `mobile-tab-${bucket}`,
  });
  const details = getBucketDetails(bucket);

  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      className={`flex-1 min-h-[44px] px-2.5 py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center whitespace-nowrap ${
        isOver
          ? 'ring-2 ring-blue-500 bg-blue-100 dark:bg-blue-900/60 scale-105 shadow-md'
          : isSelected
          ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      <div className="flex items-center gap-1">
        <span>{details.label}</span>
        <span
          className={`px-1.5 py-0.5 rounded-full text-xs ${
            isSelected
              ? details.badgeBg + ' ' + details.badgeText
              : 'bg-slate-300/60 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          {count}
        </span>
      </div>
      {bucket === 'now' && (
        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
          {nowHoursSum}h / {profile.hoursPerWeek}h
        </span>
      )}
    </button>
  );
};

const DroppableDesktopColumn: React.FC<{
  bucket: Bucket;
  columnIdeas: Idea[];
  profile: UserProfile;
  nowHoursSum: number;
  isNowFull: boolean;
  onSelectIdea: (idea: Idea) => void;
  onPinBucket: (ideaId: string, bucket: Bucket | null) => void;
  onStatusChange: (ideaId: string, status: any) => void;
  onRetryAiScoring: (idea: Idea) => void;
  onDeleteIdea: (ideaId: string) => void;
  onOpenQuickCapture: () => void;
  goals: Goal[];
  openMenuCardId: string | null;
  onToggleCardMenu: (cardId: string) => void;
  onCloseCardMenu: () => void;
  aiEnabled: boolean;
}> = ({
  bucket,
  columnIdeas,
  profile,
  nowHoursSum,
  isNowFull,
  onSelectIdea,
  onPinBucket,
  onStatusChange,
  onRetryAiScoring,
  onDeleteIdea,
  onOpenQuickCapture,
  goals,
  openMenuCardId,
  onToggleCardMenu,
  onCloseCardMenu,
  aiEnabled,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `desktop-col-${bucket}`,
  });
  const details = getBucketDetails(bucket);
  const isNow = bucket === 'now';

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl border-2 transition-all min-h-[520px] ${
        isOver
          ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-400/50 scale-[1.01]'
          : details.borderColor
      }`}
    >
      {/* Column Header */}
      <div className={`p-4 rounded-t-2xl border-b border-slate-200/60 dark:border-slate-800 ${details.headerBg}`}>
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
              {details.label}
            </h3>
            <span
              className={`px-2 py-0.5 text-xs font-bold rounded-full ${details.badgeBg} ${details.badgeText}`}
            >
              {columnIdeas.length}
            </span>
          </div>

          {isNow && (
            <span
              title="Now limit: Within weekly hours budget"
              className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                isNowFull
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              }`}
            >
              {nowHoursSum}h / {profile.hoursPerWeek}h
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
          {details.description}
        </p>

        {isNow && isNowFull && (
          <div className="mt-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1.5 rounded-lg flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Weekly hours budget reached ({nowHoursSum}h / {profile.hoursPerWeek}h). Additional ideas spill to Next.</span>
          </div>
        )}
      </div>

      {/* Column Cards Container */}
      <div className="p-3 space-y-3 flex-1 overflow-y-auto">
        {columnIdeas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
              No ideas in {details.label}
            </p>
            <button
              onClick={onOpenQuickCapture}
              className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 min-h-[44px] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add an idea
            </button>
          </div>
        ) : (
          columnIdeas.map((idea) => {
            const daysSinceActivity = Math.floor(
              (Date.now() - idea.lastActivityAt) / (1000 * 60 * 60 * 24)
            );
            const isStale = isNow && daysSinceActivity >= 14;

            return (
              <DraggableIdeaCard
                key={idea.id}
                idea={idea}
                goals={goals}
                onSelect={onSelectIdea}
                onPinBucket={onPinBucket}
                onStatusChange={onStatusChange}
                onRetryAiScoring={onRetryAiScoring}
                onDeleteIdea={onDeleteIdea}
                isStale={isStale}
                isMenuOpen={openMenuCardId === idea.id}
                onToggleMenu={() => onToggleCardMenu(idea.id)}
                onCloseMenu={onCloseCardMenu}
                aiEnabled={aiEnabled}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export const BoardView: React.FC<BoardViewProps> = ({
  ideas,
  profile,
  goals,
  onSelectIdea,
  onPinBucket,
  onStatusChange,
  onRetryAiScoring,
  onDeleteIdea,
  onOpenQuickCapture,
  aiEnabled,
}) => {
  const [mobileBucket, setMobileBucket] = useState<Bucket>('now');
  const [activeDragIdeaId, setActiveDragIdeaId] = useState<string | null>(null);
  const [openMenuCardId, setOpenMenuCardId] = useState<string | null>(null);

  const touchStartXRef = useRef<number | null>(null);
  const touchCurrentXRef = useRef<number | null>(null);

  // Close open card menu on click/tap outside or Escape
  useEffect(() => {
    const handleGlobalDismiss = () => {
      setOpenMenuCardId(null);
    };
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenuCardId(null);
      }
    };
    window.addEventListener('click', handleGlobalDismiss);
    window.addEventListener('pointerdown', handleGlobalDismiss);
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('click', handleGlobalDismiss);
      window.removeEventListener('pointerdown', handleGlobalDismiss);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  const handleToggleCardMenu = (cardId: string) => {
    setOpenMenuCardId((prev) => (prev === cardId ? null : cardId));
  };

  const handleCloseCardMenu = () => {
    setOpenMenuCardId(null);
  };

  // Configure @dnd-kit sensors:
  // Pointer sensor with 8px activation distance
  // Touch sensor with ~250ms long press delay so tap opens card and normal swipe scrolls
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });

  const sensors = useSensors(pointerSensor, touchSensor);

  // Group active ideas by computed bucket
  const activeIdeas = ideas.filter(
    (i) => i.status !== 'done' && i.status !== 'dropped'
  );

  const buckets: Bucket[] = ['now', 'next', 'later', 'parked'];

  const bucketMap: Record<Bucket, Idea[]> = {
    now: [],
    next: [],
    later: [],
    parked: [],
  };

  for (const idea of activeIdeas) {
    if (bucketMap[idea.bucket]) {
      bucketMap[idea.bucket].push(idea);
    }
  }

  // Sort each bucket by priority desc
  for (const b of buckets) {
    bucketMap[b].sort((a, b) => b.priorityScore - a.priorityScore);
  }

  // Now column stats: No 3-idea limit (maxNowCount removed). Only weekly hours limit stays.
  const nowIdeas = bucketMap['now'];
  const nowHoursSum = nowIdeas.reduce((sum, i) => sum + (i.hoursPerWeekNeeded || 0), 0);
  const isNowFull = nowHoursSum >= profile.hoursPerWeek;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragIdeaId(String(event.active.id));
    setOpenMenuCardId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragIdeaId(null);
    if (!over) return;

    const rawOverId = String(over.id);
    const targetBucket = rawOverId.replace(
      /^(desktop-col-|mobile-tab-|mobile-col-)/,
      ''
    ) as Bucket;

    const ideaId = String(active.id);
    const draggedIdea = ideas.find((i) => i.id === ideaId);
    if (!draggedIdea) return;

    // Dropping a card back on its own column does nothing
    if (draggedIdea.bucket === targetBucket) {
      return;
    }

    onPinBucket(ideaId, targetBucket);
  };

  // Mobile Swipe Left / Right to switch columns when not dragging
  const handleTouchStart = (e: React.TouchEvent) => {
    if (activeDragIdeaId) return;
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (activeDragIdeaId) return;
    touchCurrentXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (activeDragIdeaId) return;
    if (touchStartXRef.current !== null && touchCurrentXRef.current !== null) {
      const diffX = touchCurrentXRef.current - touchStartXRef.current;
      const currentIndex = buckets.indexOf(mobileBucket);

      if (diffX < -45) {
        // Swiped left -> Next column
        if (currentIndex < buckets.length - 1) {
          setMobileBucket(buckets[currentIndex + 1]);
        }
      } else if (diffX > 45) {
        // Swiped right -> Previous column
        if (currentIndex > 0) {
          setMobileBucket(buckets[currentIndex - 1]);
        }
      }
    }
    touchStartXRef.current = null;
    touchCurrentXRef.current = null;
  };

  const activeMobileDetails = getBucketDetails(mobileBucket);
  const activeMobileIdeas = bucketMap[mobileBucket];
  const isMobileNow = mobileBucket === 'now';
  const activeDragIdea = activeDragIdeaId
    ? ideas.find((i) => i.id === activeDragIdeaId) || null
    : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-5">
        {/* PHONE VIEW (< 768px): Row of droppable tabs under header + one column at a time with swipe */}
        <div className="block md:hidden">
          {/* Row of Tabs: Now, Next, Later, Parked (each acts as a droppable target!) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl mb-3 overflow-x-auto scrollbar-none">
            {buckets.map((b) => (
              <DroppableTab
                key={b}
                bucket={b}
                isSelected={mobileBucket === b}
                count={bucketMap[b].length}
                nowHoursSum={nowHoursSum}
                profile={profile}
                onClick={() => setMobileBucket(b)}
              />
            ))}
          </div>

          {/* Mobile Single Column Card Container with Swipe Handling */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`flex flex-col bg-slate-50/80 dark:bg-slate-900/40 rounded-2xl border-2 transition-all min-h-[450px] pb-32 ${activeMobileDetails.borderColor}`}
          >
            {/* Header of active mobile column */}
            <div className={`p-4 rounded-t-2xl border-b border-slate-200/60 dark:border-slate-800 ${activeMobileDetails.headerBg}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                    {activeMobileDetails.label}
                  </h3>
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded-full ${activeMobileDetails.badgeBg} ${activeMobileDetails.badgeText}`}
                  >
                    {activeMobileIdeas.length} ideas
                  </span>
                </div>

                {isMobileNow && (
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                      isNowFull
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {nowHoursSum}h / {profile.hoursPerWeek}h
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {activeMobileDetails.description}
              </p>

              {isMobileNow && isNowFull && (
                <div className="mt-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>Weekly hours budget reached ({nowHoursSum}h / {profile.hoursPerWeek}h). Additional ideas spill to Next.</span>
                </div>
              )}
            </div>

            {/* Cards for active mobile column */}
            <div className="p-3 space-y-3 flex-1 overflow-y-auto">
              {activeMobileIdeas.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                    No ideas in {activeMobileDetails.label}
                  </p>
                  <button
                    onClick={onOpenQuickCapture}
                    className="mt-3 min-h-[44px] px-4 py-2 text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add an idea
                  </button>
                </div>
              ) : (
                activeMobileIdeas.map((idea) => {
                  const daysSinceActivity = Math.floor(
                    (Date.now() - idea.lastActivityAt) / (1000 * 60 * 60 * 24)
                  );
                  const isStale = isMobileNow && daysSinceActivity >= 14;

                  return (
                    <DraggableIdeaCard
                      key={idea.id}
                      idea={idea}
                      goals={goals}
                      onSelect={onSelectIdea}
                      onPinBucket={onPinBucket}
                      onStatusChange={onStatusChange}
                      onRetryAiScoring={onRetryAiScoring}
                      onDeleteIdea={onDeleteIdea}
                      isStale={isStale}
                      isMenuOpen={openMenuCardId === idea.id}
                      onToggleMenu={() => handleToggleCardMenu(idea.id)}
                      onCloseMenu={handleCloseCardMenu}
                      aiEnabled={aiEnabled}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* DESKTOP VIEW (>= 768px): 4 Droppable Columns side by side */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-start pb-24">
          {buckets.map((bucket) => (
            <DroppableDesktopColumn
              key={bucket}
              bucket={bucket}
              columnIdeas={bucketMap[bucket]}
              profile={profile}
              nowHoursSum={nowHoursSum}
              isNowFull={isNowFull}
              onSelectIdea={onSelectIdea}
              onPinBucket={onPinBucket}
              onStatusChange={onStatusChange}
              onRetryAiScoring={onRetryAiScoring}
              onDeleteIdea={onDeleteIdea}
              onOpenQuickCapture={onOpenQuickCapture}
              goals={goals}
              openMenuCardId={openMenuCardId}
              onToggleCardMenu={handleToggleCardMenu}
              onCloseCardMenu={handleCloseCardMenu}
              aiEnabled={aiEnabled}
            />
          ))}
        </div>
      </div>

      {/* Floating Drag Overlay */}
      <DragOverlay>
        {activeDragIdea ? (
          <div className="w-80 shadow-2xl rounded-xl opacity-95 rotate-2 pointer-events-none cursor-grabbing">
            <IdeaCard
              idea={activeDragIdea}
              goals={goals}
              onSelect={() => {}}
              onPinBucket={() => {}}
              onStatusChange={() => {}}
              onRetryAiScoring={() => {}}
              isStale={false}
              aiEnabled={aiEnabled}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
