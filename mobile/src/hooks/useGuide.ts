import { useEffect, useState } from 'react';
import { isGuideCompleted, markGuideCompleted } from '../storage/guideStorage';

export type GuideStatus = 'loading' | 'show' | 'done';

export function useGuide() {
  const [status, setStatus] = useState<GuideStatus>('loading');

  useEffect(() => {
    isGuideCompleted().then((done) => {
      setStatus(done ? 'done' : 'show');
    });
  }, []);

  async function completeGuide() {
    await markGuideCompleted();
    setStatus('done');
  }

  return { status, completeGuide };
}
