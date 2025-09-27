import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getHierarchicalTaskId(task: any, allTasks: any[]): string {
  // If this is a subtask (has parent_task_id), generate hierarchical ID
  if (task.parent_task_id) {
    // Find the parent task in the allTasks array (which contains parent tasks with subtasks attached)
    const parentTask = allTasks.find(t => t.id === task.parent_task_id);
    if (parentTask && parentTask.task_id && parentTask.subtasks) {
      // Find all subtasks of this parent from the parent's subtasks array
      const siblings = parentTask.subtasks
        .sort((a, b) => (a.task_order || 0) - (b.task_order || 0) || a.created_at.localeCompare(b.created_at));

      // Find the index of current task among siblings
      const siblingIndex = siblings.findIndex(t => t.id === task.id);

      // Debug logging
      if (siblingIndex === -1) {
        console.log('Subtask not found in parent subtasks:', {
          taskId: task.id,
          parentId: task.parent_task_id,
          parentSubtasksIds: siblings.map(s => s.id),
          allTasksCount: allTasks.length
        });
      }

      // Safety check: if not found or invalid index, default to 0
      const safeIndex = siblingIndex >= 0 ? siblingIndex : 0;

      // Generate letter suffix (A, B, C, etc.)
      const letterSuffix = String.fromCharCode(65 + safeIndex); // 65 is 'A'

      return `${parentTask.task_id}${letterSuffix}`;
    }
  }

  // For parent tasks, just return the task_id
  return task.task_id ? `${task.task_id}` : '--';
}
