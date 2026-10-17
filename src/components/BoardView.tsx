import React, { useState } from 'react';
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
  onOpenQuickCapture: () => void;
}

export const BoardView: React.FC<BoardViewProps> = ({
  ideas,
  profile,
  goals,
  onSelectIdea,
  onPinBucket,
  onStatusChange,
  onRetryAiScoring,
  onOpenQuickCapture,
}) => {
  const [dragOverBucket, setDragOverBucket] = useState<Bucket | null>(null);

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

  // Now column stats
  const nowIdeas = bucketMap['now'];
  const nowHoursSum = nowIdeas.reduce((sum, i) => sum + (i.hoursPerWeekNeeded || 0), 0);
  const nowCount = nowIdeas.length;
  const isNowFull = nowCount >= 3 || nowHoursSum >= profile.hoursPerWeek;

  const handleDragOver = (e: React.DragEvent, bucket: Bucket) => {
    e.preventDefault();
    setDragOverBucket(bucket);
  };

  const handleDragLeave = () => {
    setDragOverBucket(null);
  };

  const handleDrop = (e: React.DragEvent, bucket: Bucket) => {
    e.preventDefault();
    setDragOverBucket(null);
    const ideaId = e.dataTransfer.getData('text/plain');
    if (ideaId) {
      onPinBucket(ideaId, bucket);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      {/* 4 Column Board Grid - Clean top start without focus budget banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-start">
        {buckets.map((bucket) => {
          const details = getBucketDetails(bucket);
          const columnIdeas = bucketMap[bucket];
          const isNow = bucket === 'now';

          return (
            <div
              key={bucket}
              onDragOver={(e) => handleDragOver(e, bucket)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, bucket)}
              className={`flex flex-col bg-slate-50/70 dark:bg-slate-900/40 rounded-2xl border-2 transition-all min-h-[520px] ${
                dragOverBucket === bucket
                  ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 scale-[1.01]'
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
                      title="Now limits: Max 3 items and within weekly hours"
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        isNowFull
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {nowHoursSum}h / {profile.hoursPerWeek}h
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                  {details.description}
                </p>

                {isNow && isNowFull && (
                  <div className="mt-2 text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded flex items-center gap-1">
                    <Info className="w-3 h-3 shrink-0" />
                    <span>Focus limit active. Other items spill to Next.</span>
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
                      className="mt-2 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
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
                      <div
                        key={idea.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', idea.id);
                        }}
                      >
                        <IdeaCard
                          idea={idea}
                          goals={goals}
                          onSelect={onSelectIdea}
                          onPinBucket={onPinBucket}
                          onStatusChange={onStatusChange}
                          onRetryAiScoring={onRetryAiScoring}
                          isStale={isStale}
                        />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
