import React from 'react';
import { Box, Heading, Button } from '@primer/react';
import { PlusIcon } from '@primer/octicons-react';

interface HeaderProps {
    onCreateEnvironment: () => void;
}

const Header: React.FC<HeaderProps> = ({ onCreateEnvironment }) => {
    return (
        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
            <Box display="flex" alignItems="center">
                <Heading as="h1" sx={{ fontSize: 3, margin: 0, display: ['none', 'block'] }}>
                    MultiChrome - Chrome多环境管理
                </Heading>
                <Heading as="h1" sx={{ fontSize: 2, margin: 0, display: ['block', 'none'] }}>
                    MultiChrome
                </Heading>
            </Box>

            <Button
                variant="primary"
                leadingIcon={PlusIcon}
                onClick={onCreateEnvironment}
                sx={{ marginLeft: 3 }}
            >
                <Box as="span" sx={{ display: ['none', 'inline'] }}>新建环境</Box>
                <Box as="span" sx={{ display: ['inline', 'none'] }}>新建</Box>
            </Button>
        </Box>
    );
};

export default Header; 