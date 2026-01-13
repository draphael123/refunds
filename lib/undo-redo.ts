export class UndoRedoManager<T> {
  private history: T[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 50;

  constructor(initialState: T, maxHistorySize: number = 50) {
    this.history = [initialState];
    this.currentIndex = 0;
    this.maxHistorySize = maxHistorySize;
  }

  addState(state: T): void {
    // Remove any states after current index (if we're in the middle of history)
    this.history = this.history.slice(0, this.currentIndex + 1);
    
    // Add new state
    this.history.push(state);
    this.currentIndex++;
    
    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  undo(): T | null {
    if (this.canUndo()) {
      this.currentIndex--;
      return this.history[this.currentIndex];
    }
    return null;
  }

  redo(): T | null {
    if (this.canRedo()) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    }
    return null;
  }

  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  getCurrentState(): T {
    return this.history[this.currentIndex];
  }

  clear(): void {
    const currentState = this.getCurrentState();
    this.history = [currentState];
    this.currentIndex = 0;
  }
}

