// CustomDualListBox.jsx
import { useState, useMemo, useCallback } from 'react';
import { ListGroup, Button, FormControl, Row, Col, InputGroup } from 'react-bootstrap';

const CustomDualListBox = ({ options, selected, onChange, filterPlaceholder = 'Search...', style }) => {
  const [availableSelected, setAvailableSelected] = useState([]);
  const [selectedSelected, setSelectedSelected] = useState([]);
  const [filter, setFilter] = useState('');

  // Filter options based on search input
  const filteredOptions = useMemo(() => {
    if (!filter) return options;
    return options.filter(option =>
      option.label.toLowerCase().includes(filter.toLowerCase())
    );
  }, [options, filter]);

  // Available groups (not in selected)
  const availableGroups = useMemo(() => {
    return filteredOptions.filter(
      option => !selected.includes(option.value)
    );
  }, [filteredOptions, selected]);

  // Selected groups
  const selectedGroups = useMemo(() => {
    return options.filter(option => selected.includes(option.value));
  }, [options, selected]);

  // Handle moving items from available to selected
  const handleMoveToSelected = useCallback(() => {
    if (availableSelected.length > 0) {
      const newSelected = [...new Set([...selected, ...availableSelected])];
      setAvailableSelected([]);
      onChange(newSelected);
    }
  }, [availableSelected, selected, onChange]);

  // Handle moving items from selected to available
  const handleMoveToAvailable = useCallback(() => {
    if (selectedSelected.length > 0) {
      const newSelected = selected.filter(id => !selectedSelected.includes(id));
      setSelectedSelected([]);
      onChange(newSelected);
    }
  }, [selectedSelected, selected, onChange]);

  // Move all to selected
  const handleMoveAllToSelected = useCallback(() => {
    const allValues = options.map(option => option.value);
    onChange(allValues);
    setAvailableSelected([]);
  }, [options, onChange]);

  // Move all to available
  const handleMoveAllToAvailable = useCallback(() => {
    onChange([]);
    setSelectedSelected([]);
  }, [onChange]);

  return (
    <Row className="gx-2">
      <Col>
        <InputGroup className="mb-2">
          <FormControl
            placeholder={filterPlaceholder}
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
          {filter && (
            <Button variant="outline-secondary" onClick={() => setFilter('')}>
              Clear
            </Button>
          )}
        </InputGroup>
        <ListGroup
          style={{
            maxHeight: style?.height || '200px',
            overflowY: 'auto',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            ...style,
          }}
        >
          {availableGroups.length === 0 ? (
            <ListGroup.Item disabled>No groups available</ListGroup.Item>
          ) : (
            availableGroups.map(option => (
              <ListGroup.Item
                key={option.value}
                active={availableSelected.includes(option.value)}
                onClick={() =>
                  setAvailableSelected(prev =>
                    prev.includes(option.value)
                      ? prev.filter(id => id !== option.value)
                      : [...prev, option.value]
                  )
                }
                style={{ cursor: 'pointer' }}
              >
                {option.label}
              </ListGroup.Item>
            ))
          )}
        </ListGroup>
      </Col>
      <Col xs="auto" className="d-flex flex-column justify-content-center align-items-center">
        <Button
          variant="outline-primary"
          size="sm"
          onClick={handleMoveToSelected}
          disabled={availableSelected.length === 0}
          className="mb-1"
        >
          &gt;
        </Button>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={handleMoveToAvailable}
          disabled={selectedSelected.length === 0}
          className="mb-1"
        >
          &lt;
        </Button>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={handleMoveAllToSelected}
          disabled={availableGroups.length === 0}
          className="mb-1"
        >
          &gt;&gt;
        </Button>
        <Button
          variant="outline-primary"
          size="sm"
          onClick={handleMoveAllToAvailable}
          disabled={selectedGroups.length === 0}
        >
          &lt;&lt;
        </Button>
      </Col>
      <Col>
        <ListGroup
          style={{
            maxHeight: style?.height || '200px',
            overflowY: 'auto',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            ...style,
          }}
        >
          {selectedGroups.length === 0 ? (
            <ListGroup.Item disabled>No groups selected</ListGroup.Item>
          ) : (
            selectedGroups.map(option => (
              <ListGroup.Item
                key={option.value}
                active={selectedSelected.includes(option.value)}
                onClick={() =>
                  setSelectedSelected(prev =>
                    prev.includes(option.value)
                      ? prev.filter(id => id !== option.value)
                      : [...prev, option.value]
                  )
                }
                style={{ cursor: 'pointer' }}
              >
                {option.label}
              </ListGroup.Item>
            ))
          )}
        </ListGroup>
      </Col>
    </Row>
  );
};

export default CustomDualListBox;