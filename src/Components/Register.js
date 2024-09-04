import React, { useState } from 'react';
import { Form, Button, Alert, Spinner, Card, Col, Row, Container } from 'react-bootstrap';

function Register({ onRegister }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  // Function to send OTP
 // Function to send OTP
const handleSendOtp = async (e) => {
  e.preventDefault();
  setLoading(true);

  // Validate phone number format (E.164)
  if (!phoneNumber.startsWith('+')) {
    setError('Please enter your phone number in international format, e.g., +1234567890.');
    setLoading(false);
    return;
  }

  try {
    const response = await fetch(`${backendUrl}/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber }),
    });

    const data = await response.json();
    setLoading(false);

    if (data.success) {
      setOtpSent(true);
    } else {
      setError(data.message);
    }
  } catch (err) {
    setLoading(false);
    setError('Failed to send OTP.');
  }
};


  // Function to verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${backendUrl}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, otp }),
      });

      const data = await response.json();
      setLoading(false);

      if (data.success) {
        onRegister(data.user, phoneNumber); // Pass the verified user and phone number
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } catch (err) {
      setLoading(false);
      setError('Failed to verify OTP.');
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100">
      <Row className="w-100 justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-sm">
            <Card.Body>
              <h2 className="text-center mb-4">Register</h2>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}>
                <Form.Group controlId="formPhoneNumber" className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    disabled={otpSent}
                  />
                </Form.Group>
                {otpSent && (
                  <Form.Group controlId="formOtp" className="mb-3">
                    <Form.Label>OTP</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter the OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                  </Form.Group>
                )}
                <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                      />{' '}
                      {otpSent ? 'Verifying...' : 'Sending OTP...'}
                    </>
                  ) : otpSent ? (
                    'Verify OTP'
                  ) : (
                    'Send OTP'
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Register;
