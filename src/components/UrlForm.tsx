import { Form, InputGroup, Button, Spinner } from 'react-bootstrap';

interface UrlFormProps {
  url: string;
  setUrl: (url: string) => void;
  isConverting: boolean;
  isLoadingInfo: boolean;
}

export default function UrlForm({ url, setUrl, isConverting, isLoadingInfo }: UrlFormProps) {
  return (
    <InputGroup className="mb-3" size="lg">
      <Form.Control
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="YouTube動画のURLをここに貼り付け"
        aria-label="YouTube URL"
        disabled={isConverting}
        style={{ fontSize: '1.0rem', padding: '0.75rem' }}
      />
      <Button variant="outline-secondary" onClick={() => setUrl('')} disabled={!url || isConverting || isLoadingInfo} size="lg">
        &times;
      </Button>
      {isLoadingInfo && (
        <InputGroup.Text>
          <Spinner animation="border" />
        </InputGroup.Text>
      )}
    </InputGroup>
  );
}