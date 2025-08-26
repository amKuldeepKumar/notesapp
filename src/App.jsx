// src/App.jsx
import {
  Authenticator,
  Badge,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Image,
  SelectField,
  Text,
  TextAreaField,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  View,
  useTheme,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { getUrl, remove, uploadData } from "aws-amplify/storage";
import { useEffect, useRef, useState } from "react";
import outputs from "../amplify_outputs.json";

Amplify.configure(outputs);
const client = generateClient();

// ---------- Helpers ----------
const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const getStatusColor = (status) => {
  switch (status) {
    case "active":
      return "success";
    case "inactive":
      return "neutral";
    default:
      return "info";
  }
};

// ---------- NoteCard ----------
function NoteCard({ note, onUpdateStatus, onDelete, tokens }) {
  return (
    <Card variation="outlined" height="100%">
      <Flex direction="column" gap={tokens.space.small} height="100%">
        <Flex direction="row" justifyContent="space-between">
          <Heading level={4}>{note.name}</Heading>
          <Badge size="small" variation={getStatusColor(note.status)}>
            {note.status}
          </Badge>
        </Flex>

        <Text>{note.description}</Text>

        {note.createdAt && (
          <Text
            fontSize={tokens.fontSizes.small}
            color={tokens.colors.font.tertiary}
          >
            Created: {formatDate(note.createdAt)}
          </Text>
        )}

        {note.imageUrl && (
          <Image
            src={note.imageUrl}
            alt={note.name}
            width="100%"
            height="150px"
            objectFit="cover"
            borderRadius={tokens.radii.medium}
          />
        )}

        <Flex direction="row" gap={tokens.space.small} marginTop="auto">
          <Button
            onClick={() =>
              onUpdateStatus(
                note.id,
                note?.status === "active" ? "inactive" : "active"
              )
            }
          >
            Mark {note.status === "active" ? "Inactive" : "Active"}
          </Button>

          <Button
            variation="destructive"
            onClick={() => onDelete(note.id, note.image)}
            size="small"
          >
            Delete
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}

// ---------- NotesGrid ----------
function NotesGrid({
  notes,
  isLoading,
  onUpdateStatus,
  onDelete,
  tokens,
  currentFilter,
}) {
  return (
    <View
      display="flex"
      border={"1px solid " + tokens.colors.border.secondary}
      borderRadius={tokens.radii.medium}
      padding={tokens.space.medium}
      textAlign="center"
    >
      {!isLoading && (
        <View
          style={{ overflowX: "auto", overflowY: "hidden", maxWidth: "100%" }}
        >
          <Grid
            templateColumns="repeat(3, 1fr)"
            gap={tokens.space.medium}
            marginTop={tokens.space.medium}
            minWidth="900px"
          >
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                tokens={tokens}
                onUpdateStatus={onUpdateStatus}
                onDelete={onDelete}
              />
            ))}

            {notes.length === 0 && (
              <Card gridColumn="1 / -1">
                <Text color={tokens.colors.font.tertiary} textAlign="center">
                  {currentFilter === "all"
                    ? "No notes yet. Create your first note above!"
                    : `No ${currentFilter} notes found.`}
                </Text>
              </Card>
            )}
          </Grid>
        </View>
      )}
    </View>
  );
}

// ---------- FilterBar ----------
function FilterBar({ currentFilter, onFilterChange, getFilteredCount }) {
  return (
    <ToggleButtonGroup
      value={currentFilter}
      onChange={(value) => onFilterChange(value)}
      isExclusive
    >
      {["all", "active", "inactive"].map((filter) => (
        <ToggleButton key={filter} value={filter}>
          <Flex gap="0.25rem" alignItems="center">
            <Text>{filter.charAt(0).toUpperCase() + filter.slice(1)}</Text>
            <Badge
              size="small"
              variation={
                filter === "active"
                  ? "success"
                  : filter === "inactive"
                    ? "neutral"
                    : "info"
              }
            >
              {getFilteredCount(filter)}
            </Badge>
          </Flex>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

// ---------- NoteFormModal ----------
function NoteFormModal({
  show,
  onClose,
  onSubmit,
  name,
  setName,
  description,
  setDescription,
  status,
  setStatus,
  image,
  setImage,
  fileInputRef,
  tokens,
}) {
  if (!show) return null;

  return (
    <View
      backgroundColor="rgba(0,0,0,0.6)"
      position="fixed"
      top="0"
      left="0"
      right="0"
      bottom="0"
      display="flex"
      justifyContent="center"
      alignItems="center"
      zIndex="9999"
    >
      <View
        backgroundColor="white"
        padding="2rem"
        borderRadius="0.5rem"
        minWidth="500px"
      >
        <Card variation="elevated">
          <View display="flex" justifyContent="space-between">
            <Heading level={2}>Create Note</Heading>
            <Button variation="primary" onClick={onClose}>
              X
            </Button>
          </View>

          <form onSubmit={onSubmit}>
            <Flex direction="column" gap={tokens.space.medium}>
              <TextField
                label="Note name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter note name"
                required
              />

              <TextAreaField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter note description"
                rows={3}
                required
              />

              <SelectField
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </SelectField>

              <View>
                <Text as="label" fontSize={tokens.fontSizes.medium}>
                  Upload Image
                </Text>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => setImage(e.target.files[0])}
                  accept="image/*"
                  style={{ marginTop: tokens.space.small }}
                />
              </View>

              <Button type="submit" variation="primary">
                Create Note
              </Button>
            </Flex>
          </form>
        </Card>
      </View>
    </View>
  );
}

// ---------- Main App ----------
function App({ signOut, user }) {
  const { tokens } = useTheme();

  const [filteredNotes, setFilteredNotes] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [status, setStatus] = useState("active");
  const [currentFilter, setCurrentFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async (filterStatus = null) => {
    setIsLoading(true);
    try {
      const filter =
        filterStatus && filterStatus !== "all"
          ? { status: { eq: filterStatus } }
          : undefined;

      const notesData = await client.models.Note.list({ filter });

      const notesWithImages = await Promise.all(
        notesData.data.map(async (note) => {
          if (note.image) {
            try {
              const url = await getUrl({ path: note.image });
              return { ...note, imageUrl: url.url.toString() };
            } catch {
              return note;
            }
          }
          return note;
        })
      );

      setFilteredNotes(notesWithImages);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (filter) => {
    setCurrentFilter(filter);
    fetchNotes(filter);
  };

  const createNote = async (event) => {
    event.preventDefault();
    if (!name || !description) return;

    try {
      let imagePath = null;
      if (image) {
        imagePath = `media/${user.userId}/${image.name}-${Date.now()}`;
        await uploadData({
          path: imagePath,
          data: image,
          options: { contentType: image.type },
        });
      }

      await client.models.Note.create({
        name,
        description,
        image: imagePath,
        status: status || "active",
        createdAt: new Date().toISOString(),
      });

      setName("");
      setDescription("");
      setImage(null);
      setStatus("active");
      if (fileInputRef.current) fileInputRef.current.value = "";

      await fetchNotes(currentFilter);
      setShowModal(false);
    } catch (error) {
      console.error("Error creating note:", error);
    }
  };

  const deleteNote = async (noteId, imagePath) => {
    try {
      if (imagePath) await remove({ path: imagePath });
      await client.models.Note.delete({ id: noteId });
      await fetchNotes(currentFilter);
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const updateNoteStatus = async (noteId, newStatus) => {
    try {
      await client.models.Note.update({ id: noteId, status: newStatus });
      await fetchNotes(currentFilter);
    } catch (error) {
      console.error("Error updating note status:", error);
    }
  };

  const getFilteredCount = (status) =>
    status === "all"
      ? filteredNotes.length
      : filteredNotes.filter((n) => n.status === status).length;

  return (
    <View height="100vh">
      <Flex direction="column" gap={tokens.space.small}>
        {/* Header */}
        <Flex direction="row" justifyContent="space-between">
          <Button variation="primary" onClick={signOut}>
            Sign out
          </Button>
          <Button variation="primary" onClick={() => setShowModal(true)}>
            Create Note
          </Button>
        </Flex>

        {/* Modal */}
        <NoteFormModal
          show={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={createNote}
          {...{
            name,
            setName,
            description,
            setDescription,
            status,
            setStatus,
            image,
            setImage,
            fileInputRef,
            tokens,
          }}
        />

        {/* Notes Header */}
        <Flex
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Heading level={2}>Your Notes</Heading>
          <Text color={tokens.colors.font.tertiary}>
            {filteredNotes.length} note{filteredNotes.length !== 1 ? "s" : ""}
          </Text>
        </Flex>

        {/* Filters */}
        <Flex
          gap={tokens.space.small}
          marginBottom={tokens.space.medium}
          wrap="wrap"
        >
          <FilterBar
            currentFilter={currentFilter}
            onFilterChange={handleFilterChange}
            getFilteredCount={getFilteredCount}
          />
        </Flex>

        {/* Notes Grid */}
        {isLoading ? (
          <Card>
            <Text textAlign="center">Loading notes...</Text>
          </Card>
        ) : (
          <NotesGrid
            notes={filteredNotes}
            isLoading={isLoading}
            onUpdateStatus={updateNoteStatus}
            onDelete={deleteNote}
            tokens={tokens}
            currentFilter={currentFilter}
          />
        )}
      </Flex>
    </View>
  );
}

export default function AppWithAuth() {
  return (
    <Authenticator>
      {({ signOut, user }) => <App signOut={signOut} user={user} />}
    </Authenticator>
  );
}
