import React, { useState } from 'react';
import { Form, Button, Alert, Spinner, Card, Col, Row, Container } from 'react-bootstrap';

function SignupForm({ phoneNumber, onSignup }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Start loading spinner

    if (!phoneNumber) {
      setError('Phone number is required.');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('phoneNumber', phoneNumber); // Pass the phone number
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    if (profilePicture) {
      formData.append('profilePicture', profilePicture);
    }

    try {
      console.log('Sending form data:', formData); // Debugging: Check form data before sending
      const response = await fetch(`${backendUrl}/signup`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('Received response:', data); // Debugging: Check the response data
      setLoading(false); // Stop loading spinner

      if (response.ok && data.success) {
        onSignup(data.user); // Proceed to chat page
      } else {
        setError(data.message || 'An unexpected error occurred.');
      }
    } catch (err) {
      setLoading(false); // Stop loading spinner
      console.error('Error during signup:', err); // Debugging: Log the error
      setError('Failed to sign up. Please try again.');
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100">
      <Row className="w-100 justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-sm">
            <Card.Body>
              <h2 className="text-center mb-4">Create Your Account</h2>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit} encType="multipart/form-data">
                <Form.Group controlId="formPhoneNumber" className="mb-3">
                  <Form.Label>Phone Number</Form.Label>
                  <Form.Control
                    type="text"
                    value={phoneNumber}
                    readOnly
                  />
                </Form.Group>
                <Form.Group controlId="formName" className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group controlId="formEmail" className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group controlId="formPassword" className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>
                <Form.Group controlId="formProfilePicture" className="mb-3">
                  <Form.Label>Profile Picture</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProfilePicture(e.target.files[0])}
                  />
                </Form.Group>
                <Button
                  variant="primary"
                  type="submit"
                  className="w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                      />{' '}
                      Signing Up...
                    </>
                  ) : (
                    'Sign Up'
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

export default SignupForm;
