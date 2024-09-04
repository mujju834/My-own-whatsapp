import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, ListGroup, Image, Modal, Form } from 'react-bootstrap';
import io from 'socket.io-client';

const socket = io(process.env.REACT_APP_BACKEND_URL);

function ChatPage({ user, onLogout }) {
  const [chats, setChats] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [callAccepted, setCallAccepted] = useState(false);
  const [callerSignal, setCallerSignal] = useState(null);
  const [stream, setStream] = useState();
  const [callEnded, setCallEnded] = useState(false);
  const [caller, setCaller] = useState(null); // Store the caller's ID for incoming calls
  const [receivingCall, setReceivingCall] = useState(false); // To notify the user about the incoming call

  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`${backendUrl}/users`);
        const data = await response.json();
        if (data.success) {
          const filteredContacts = data.users.filter(contact => contact._id !== user._id);
          setContacts(filteredContacts);
        } else {
          console.error('Failed to fetch users:', data.message);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [backendUrl, user._id]);

  useEffect(() => {
    if (selectedUser) {
      const fetchChats = async () => {
        try {
          const response = await fetch(`${backendUrl}/chat-history/${user._id}/${selectedUser._id}`);
          const data = await response.json();
          if (data.success) {
            setChats(data.chatHistory);
          } else {
            console.error('Failed to fetch chat history:', data.message);
          }
        } catch (error) {
          console.error('Error fetching chat history:', error);
        }
      };
      fetchChats();
    }
  }, [selectedUser, backendUrl, user._id]);

  // Handle incoming call notification
  useEffect(() => {
    socket.on('incoming_call', (data) => {
      setIncomingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signalData);
    });

    socket.on('call_ended', () => {
      endCall();
    });

    return () => {
      socket.off('incoming_call');
      socket.off('call_ended');
    };
  }, []);

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

  const callUser = async () => {
    setIsCalling(true);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setStream(stream);

    const peer = new window.SimplePeer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on('signal', (data) => {
      socket.emit('call_user', {
        callerId: user._id,
        receiverId: selectedUser._id,
        signalData: data,
      });
    });

    peer.on('stream', (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });

    socket.on('call_accepted', (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const acceptCall = async () => {
    setIncomingCall(false);
    setCallAccepted(true);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setStream(stream);

    const peer = new window.SimplePeer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    peer.on('signal', (data) => {
      socket.emit('accept_call', {
        callerId: caller,
        signalData: data,
      });
    });

    peer.on('stream', (currentStream) => {
      userVideo.current.srcObject = currentStream;
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const declineCall = () => {
    setIncomingCall(false);
    socket.emit('decline_call', { callerId: caller });
  };

  const endCall = () => {
    setCallEnded(true);
    connectionRef.current.destroy();
    setStream(null);
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
                  src="/default-profile.png"
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
                  >
                    {contact.name} ({contact.phoneNumber})
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
              <>
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
                <div className="d-flex justify-content-center mt-3">
                  {!callAccepted && !isCalling && (
                    <Button onClick={callUser} variant="success">Call</Button>
                  )}
                  {incomingCall && !callAccepted && (
                    <Button onClick={acceptCall} variant="primary">Answer</Button>
                  )}
                  {incomingCall && !callAccepted && (
                    <Button onClick={declineCall} variant="danger">Decline</Button>
                  )}
                  {callAccepted && (
                    <Button onClick={endCall} variant="danger">End Call</Button>
                  )}
                </div>
              </>
            )}
          </Card>
          <Row className="mt-4">
            <Col md={6}>
              <video playsInline muted ref={myVideo} autoPlay style={{ width: '300px' }} />
            </Col>
            <Col md={6}>
              <video playsInline ref={userVideo} autoPlay style={{ width: '300px' }} />
            </Col>
          </Row>
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
