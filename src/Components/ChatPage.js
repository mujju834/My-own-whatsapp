import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, ListGroup, Image, Modal, Form } from 'react-bootstrap';
import io from 'socket.io-client';

const socket = io(process.env.REACT_APP_BACKEND_URL);

function ChatPage({ user, onLogout }) {
  const [chats, setChats] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [showModal, setShowModal] = useState(false);

  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  // Fetch all users (contacts) when component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      const response = await fetch(`${backendUrl}/users`);
      const data = await response.json();
      if (data.success) {
        // Filter out the current user's own contact
        const filteredContacts = data.users.filter(contact => contact._id !== user._id);
        setContacts(filteredContacts);
      }
    };

    fetchUsers();
  }, [backendUrl, user._id]);

  // Fetch chat history with the selected user
  useEffect(() => {
    if (selectedUser) {
      const fetchChats = async () => {
        const response = await fetch(`${backendUrl}/chat-history/${user._id}/${selectedUser._id}`);
        const data = await response.json();
        if (data.success) {
          setChats(data.chatHistory);
        }
      };

      fetchChats();
    }
  }, [selectedUser, backendUrl, user._id]);

  // Listen for real-time messages
  useEffect(() => {
    if (selectedUser && socket) {
      socket.emit('join_room', { senderId: user._id, receiverId: selectedUser._id });

      socket.on('receive_message', (message) => {
        setChats((prevChats) => [...prevChats, message]);
      });
    }

    return () => {
      socket.off('receive_message');
    };
  }, [selectedUser, user._id]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const response = await fetch(`${backendUrl}/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: user._id,
          receiver: selectedUser._id,
          message: newMessage,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setChats([...chats, data.newMessage]);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleLogoutClick = () => {
    setShowModal(true);
  };

  const confirmLogout = () => {
    setShowModal(false);

    // Trigger the logout function
    onLogout();

    // Reload the page immediately to complete the logout process
    window.location.reload();
  };

  const cancelLogout = () => {
    setShowModal(false);
  };

  return (
    <Container fluid className="py-4">
      <Row>
        {/* Left column - Profile and Contacts */}
        <Col md={4} lg={3}>
          <Card className="mb-4">
            <Card.Body className="text-center">
              {user && user.profilePicture ? (
                <Image
                  src={`${backendUrl}${user.profilePicture}`}
                  alt="Profile"
                  roundedCircle
                  className="mb-3"
                  style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                />
              ) : (
                <Image
                  src="/default-profile.png" // Fallback image
                  alt="Profile"
                  roundedCircle
                  className="mb-3"
                  style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                />
              )}
              <h4>{user ? user.name : 'User'}</h4>
              <Button variant="danger" className="mt-3" onClick={handleLogoutClick}>
                Logout
              </Button>
            </Card.Body>
          </Card>
          <Card>
            <Card.Header>Contacts</Card.Header>
            <ListGroup variant="flush">
              {contacts.length > 0 ? (
                contacts.map((contact) => (
                  <ListGroup.Item
                    key={contact._id}
                    active={selectedUser && selectedUser._id === contact._id}
                    onClick={() => setSelectedUser(contact)}
                    className="d-flex align-items-center"
                  >
                    <Image
                      src={`${backendUrl}${contact.profilePicture || '/default-profile.png'}`}
                      alt="Profile"
                      roundedCircle
                      style={{ width: '40px', height: '40px', objectFit: 'cover', marginRight: '10px' }}
                    />
                    <div>
                      <div>{contact.name}</div>
                      <small className="text-muted">({contact.phoneNumber})</small>
                    </div>
                  </ListGroup.Item>
                ))
              ) : (
                <ListGroup.Item className="text-center text-muted">
                  No contacts available
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card>
        </Col>

        {/* Right column - Chat History */}
        <Col md={8} lg={7}>
          <Card>
            <Card.Header as="h5">
              Chat with {selectedUser ? selectedUser.name : 'Select a contact'}
            </Card.Header>
            <ListGroup variant="flush" className="chat-history">
              {chats.length === 0 ? (
                <ListGroup.Item className="text-center text-muted">
                  No chats available
                </ListGroup.Item>
              ) : (
                chats.map((chat) => (
                  <ListGroup.Item key={chat._id} className="py-3">
                    <strong>{chat.sender === user._id ? 'You' : selectedUser.name}</strong>: {chat.message}
                  </ListGroup.Item>
                ))
              )}
            </ListGroup>
            {selectedUser && (
              <Card.Footer>
                <Form onSubmit={handleSendMessage}>
                  <Form.Group controlId="newMessage">
                    <Form.Control
                      type="text"
                      placeholder="Type a message"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Button type="submit" variant="primary" className="mt-2 w-100">
                    Send Message
                  </Button>
                </Form>
              </Card.Footer>
            )}
          </Card>
        </Col>
      </Row>

      {/* Logout Confirmation Modal */}
      <Modal show={showModal} onHide={cancelLogout} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Logout</Modal.Title>
        </Modal.Header>
        <Modal.Body>Do you really want to logout?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelLogout}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmLogout}>
            Logout
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default ChatPage;
