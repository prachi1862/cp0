import React from 'react';
import ExperiencePage from '../components/ExperiencePage';
import FlavorDiscovery from '../components/FlavorDiscovery';

const Home = ({ onAskDoubt }) => {
    const sections = [
        {
            align: 'left',
            heading: <>Every Layer <br /><span className="text-accent-red">Matters.</span></>,
            content: "From slow-braised cuts to hand-pulled noodles, balance begins with precision."
        },
        {
            align: 'right',
            heading: <>The Depth <br />Beneath.</>,
            content: "A broth simmered for hours. Rich, layered, unforgettable."
        },
        {
            align: 'center',
            heading: <>Precision in <br />Every Detail.</>,
            content: "Nothing added without purpose. Nothing removed without reason."
        }
    ];

    return (
        <>
            <ExperiencePage
                title="Crafted to Be Remembered."
                subtitle="A bowl designed with precision."
                accent="Experience the Flavor Twin."
                sections={sections}
                onAskDoubt={onAskDoubt}
            />
            <FlavorDiscovery />
        </>
    );
};

export default Home;
