import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PostTripChecklistCard from '@/components/PostTripChecklistCard';
import { useLanguage } from '@/contexts/LanguageContext';

const PostTripPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b">
        <div className="flex items-center gap-2 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">{t('postTrip.title')}</h1>
        </div>
      </div>
      <div className="p-4 max-w-2xl mx-auto">
        <PostTripChecklistCard onCompleted={() => navigate('/')} />
      </div>
    </div>
  );
};

export default PostTripPage;
