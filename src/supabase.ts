// Local IndexedDB storage for calculation history
const DB_NAME = 'EchoCalcDB';
const DB_VERSION = 1;
const STORE_NAME = 'calculation_history';

export interface CalculationHistory {
  id?: string;
  transcript: string;
  expression: string;
  result: string;
  created_at?: string;
}

class LocalDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          store.createIndex('created_at', 'created_at', { unique: false });
        }
      };
    });

    return this.dbPromise;
  }

  async save(transcript: string, expression: string, result: string): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const record: CalculationHistory = {
        transcript,
        expression,
        result,
        created_at: new Date().toISOString(),
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.add(record);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error saving to IndexedDB:', error);
      throw error;
    }
  }

  async getHistory(limit: number = 20): Promise<CalculationHistory[]> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      return new Promise<CalculationHistory[]>((resolve, reject) => {
        const request = store.getAll();
        
        request.onsuccess = () => {
          const results = request.result as CalculationHistory[];
          // Sort by created_at descending and limit
          const sorted = results
            .sort((a, b) => {
              const dateA = new Date(a.created_at || 0).getTime();
              const dateB = new Date(b.created_at || 0).getTime();
              return dateB - dateA;
            })
            .slice(0, limit);
          resolve(sorted);
        };
        
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error fetching from IndexedDB:', error);
      return [];
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error clearing IndexedDB:', error);
      throw error;
    }
  }
}

const localDB = new LocalDatabase();

export async function saveCalculation(
  transcript: string,
  expression: string,
  result: string
): Promise<void> {
  return localDB.save(transcript, expression, result);
}

export async function getCalculationHistory(limit: number = 20): Promise<CalculationHistory[]> {
  return localDB.getHistory(limit);
}

export async function clearCalculationHistory(): Promise<void> {
  return localDB.clear();
}
