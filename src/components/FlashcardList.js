import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, IconButton, Button, MobileStepper } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import RefreshIcon from '@mui/icons-material/Refresh';
import DeleteIcon from '@mui/icons-material/Delete';
import { useTheme } from '@mui/material/styles';

const FlashcardList = ({ flashcards, onDelete }) => {
    const theme = useTheme();
    const [activeStep, setActiveStep] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    const maxSteps = flashcards.length;

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
        setIsFlipped(false);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
        setIsFlipped(false);
    };

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    if (!flashcards || flashcards.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', py: 5 }}>
                <Typography variant="body1" color="text.secondary">
                    No flashcards yet. Generate some using AI!
                </Typography>
            </Box>
        );
    }

    const currentCard = flashcards[activeStep];

    return (
        <Box sx={{ maxWidth: 600, mx: 'auto', flexGrow: 1 }}>
            <Box sx={{ perspective: '1000px', cursor: 'pointer' }} onClick={handleFlip}>
                <Box
                    sx={{
                        position: 'relative',
                        width: '100%',
                        height: 300,
                        transition: 'transform 0.6s',
                        transformStyle: 'preserve-3d',
                        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    }}
                >
                    {/* Front */}
                    <Card
                        sx={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            backfaceVisibility: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            p: 2,
                            bgcolor: 'background.paper',
                            boxShadow: 3,
                        }}
                    >
                        <Typography variant="caption" color="text.secondary" sx={{ position: 'absolute', top: 16, left: 16 }}>
                            Front
                        </Typography>
                        {onDelete && (
                            <IconButton
                                size="small"
                                onClick={(e) => { e.stopPropagation(); onDelete(currentCard.id); }}
                                sx={{ position: 'absolute', top: 8, right: 8, color: 'error.main' }}
                            >
                                <DeleteIcon />
                            </IconButton>
                        )}
                        <CardContent>
                            <Typography variant="h5" align="center" component="div">
                                {currentCard.front}
                            </Typography>
                        </CardContent>
                    </Card>

                    {/* Back */}
                    <Card
                        sx={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            p: 2,
                            bgcolor: 'primary.dark', // Distinct color for back
                            color: 'primary.contrastText',
                            boxShadow: 3,
                        }}
                    >
                        <Typography variant="caption" sx={{ position: 'absolute', top: 16, left: 16, opacity: 0.7 }}>
                            Back
                        </Typography>
                        <CardContent>
                            <Typography variant="h6" align="center" component="div">
                                {currentCard.back}
                            </Typography>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            <MobileStepper
                steps={maxSteps}
                position="static"
                activeStep={activeStep}
                nextButton={
                    <Button size="small" onClick={handleNext} disabled={activeStep === maxSteps - 1}>
                        Next
                        <NavigateNextIcon />
                    </Button>
                }
                backButton={
                    <Button size="small" onClick={handleBack} disabled={activeStep === 0}>
                        <NavigateBeforeIcon />
                        Back
                    </Button>
                }
                sx={{ bgcolor: 'transparent', mt: 2 }}
            />

            <Box sx={{ textAlign: 'center', mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                    Click card to flip • {activeStep + 1} of {maxSteps}
                </Typography>
            </Box>
        </Box>
    );
};

export default FlashcardList;
