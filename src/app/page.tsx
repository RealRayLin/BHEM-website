'use client';

import dynamic from 'next/dynamic';

const FullscreenPDFViewer = dynamic(
  () => import('./components/FullscreenPDFViewer'),
  { 
    ssr: false
  }
);

export default function Home() {
  return (
    <main>
      {/* SEO-friendly content for search engines */}
      <div className="sr-only">
        <h1>BHEM - Black Heritage Experience Manitoba</h1>
        <h2>Celebrating and Preserving African Heritage in Manitoba</h2>
        
        <section>
          <h3>About BHEM</h3>
          <p>
            Black Heritage Experience Manitoba (BHEM) is dedicated to celebrating and preserving 
            African heritage, culture, and history in Manitoba, Canada. We showcase the rich 
            cultural legacy and journey to emancipation of Black communities in Manitoba.
          </p>
        </section>
        
        <section>
          <h3>Our Mission</h3>
          <p>
            Our mission is to educate, inspire, and preserve the stories, achievements, and 
            cultural contributions of Black Manitobans. Through our museum and cultural programs, 
            we aim to foster understanding and appreciation of Black heritage.
          </p>
        </section>
        
        <section>
          <h3>Featured Content</h3>
          <ul>
            <li>
              <strong>Journey to Emancipation:</strong> Explore our historical timeline 
              and video content showcasing the path to freedom and empowerment.
            </li>
            <li>
              <strong>Why the Museum:</strong> Discover the importance of preserving 
              Black heritage and the role of our museum in the community.
            </li>
            <li>
              <strong>Brand Experience:</strong> Interactive presentation of BHEM&apos;s 
              visual identity, mission, and community impact.
            </li>
          </ul>
        </section>
        
        <section>
          <h3>Visit Information</h3>
          <p>
            Located in Manitoba, Canada, BHEM serves as a cultural hub for the African 
            Canadian community and all those interested in learning about Black heritage.
          </p>
        </section>
      </div>
      
      {/* Main interactive PDF viewer */}
      <FullscreenPDFViewer />
    </main>
  );
}
