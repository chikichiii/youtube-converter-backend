'use client';

import { useState } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';

interface LoginModalProps {
  onClose: () => void;
  show: boolean; // これを追加
  onLoginSuccess: () => void; // これを追加
}

export default function LoginModal({ onClose, show, onLoginSuccess }: LoginModalProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        console.log('Login successful');
        onLoginSuccess(); // これを追加
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || 'ログインに失敗しました。');
      }
    } catch (err) {
      setError('ログイン中にエラーが発生しました。');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>管理者ログイン</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="password">
            <Form.Label>パスワード</Form.Label>
            <Form.Control
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              disabled={isLoading}
            />
          </Form.Group>
          {error && <Alert variant="danger">{error}</Alert>}
          <div className="d-grid gap-2">
            <Button variant="primary" type="submit" disabled={isLoading}>
              {isLoading ? 'ログイン中...' : 'ログイン'}
            </Button>
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>
              閉じる
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}