import { ThemeProvider } from '@/contexts/ThemeContext';
import { AIProvider } from '@/contexts/AIContext';
import { AIInterface } from '@/components/AIInterface';

const Index = () => {
  console.log('Index: Component loading...');
  
  try {
    console.log('Index: Rendering ThemeProvider...');
    return (
      <ThemeProvider>
        <AIProvider>
          <AIInterface />
        </AIProvider>
      </ThemeProvider>
    );
  } catch (error) {
    console.error('Index: Error rendering component:', error);
    return <div>Error loading AI Interface</div>;
  }
};

export default Index;
