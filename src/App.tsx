import React, { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';

import TagAdd from './components/TagAdd';
import MatomoTracker from './MatomeTracker';

import 'react-toastify/dist/ReactToastify.css';
import './App.css';

const BASEURL =
  import.meta.env.VITE_STRAPI_ENDPOINT_CREATE || 'http://localhost:1337';
const STRAPI_TOKEN = import.meta.env.VITE_STRAPI_TOKEN || 'secret';
const matomoUrl = 'https://rumalune.com/gga/';
const siteId = '2';

interface FormData {
  title: string;
  url: string;
  dateHappened: string;
  content: string;
  autoTags: string;
  quckComment: string;
  tags: number[];
  passPhrase1: string;
  passPhrase2: string;
}

interface Tag {
  id: number;
  attributes: {
    name: string;
  };
}

const App: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    url: '',
    dateHappened: new Date().toISOString(),
    content: '',
    autoTags: '',
    quckComment: '',
    tags: [], // Initialize tags as an empty array
    passPhrase1: '',
    passPhrase2: '',
  });
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

  const tagDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        if (!ignore) {
          const response = await fetch(`${BASEURL}/api/tags`);
          if (!response.ok) {
            throw new Error(`Failed to fetch tags: ${response.status}`);
          }
          const data = await response.json();
          setAvailableTags(data.data);
        }
      } catch (error) {
        console.error('Error fetching tags:', error);
        toast.error('Failed to load tags.');
      }
    };

    let ignore = false;
    fetchTags();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tagDropdownRef.current &&
        !tagDropdownRef.current.contains(event.target as Node)
      ) {
        setTagDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleTagChange = (tag: number) => {
    const updatedTags = formData.tags.includes(tag)
      ? formData.tags.filter((t) => t !== tag)
      : [...formData.tags, tag];
    setFormData({ ...formData, tags: updatedTags });
  };

  const submitWithRetry = async (retryCount = 0): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 seconds timeout

      const response = await fetch(`${BASEURL}/api/newstreams`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${formData.passPhrase1 + STRAPI_TOKEN + formData.passPhrase2}`,
        },
        body: JSON.stringify({
          data: {
            title: formData.title,
            url: formData.url,
            dateHappened: formData.dateHappened,
            content: [
              {
                type: 'paragraph',
                children: [
                  {
                    text: formData.content,
                    type: 'text',
                  },
                ],
              },
            ],
            meta: {
              quckTag: ['__test', '__hand_input', formData.autoTags].join(', '),
              quckComment: formData.quckComment,
            },
            public: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishedAt: new Date().toISOString(),
            locale: 'zh-Hant-HK',
          },
        }),
      });

      clearTimeout(timeoutId);

      if (response.status === 200) {
        const newStreamData = await response.json();
        const newStreamId = newStreamData.data.id;

        // Second fetch to link tags
        const tagsResponse = await fetch(
          `${BASEURL}/api/newstreams/${newStreamId}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${formData.passPhrase1 + STRAPI_TOKEN + formData.passPhrase2}`,
            },
            body: JSON.stringify({
              data: {
                tags: {
                  connect: formData.tags
                    .map((tagId) => {
                      const tag = availableTags.find((t) => t.id === tagId);
                      return { id: tag?.id };
                    })
                    .filter(Boolean), // Filter out undefined tags if not found
                },
              },
            }),
          },
        );

        if (tagsResponse.ok) {
          toast.success('Entry and tags submitted successfully!');
          return true;
        } else {
          toast.error(`Failed to link tags: ${tagsResponse.status}`);
          // Consider handling this error more robustly, e.g., rollback the newstream creation
          return false;
        }
      }

      throw new Error(`API responded with status ${response.status}`);
    } catch (error) {
      if (retryCount < 3) {
        toast.warning(
          `Attempt ${retryCount + 1} failed. Retrying in 10 seconds...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 10000));
        return submitWithRetry(retryCount + 1);
      }

      toast.error('Failed to submit after 3 attempts');
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.passPhrase1 || !formData.passPhrase2) {
      toast.error('Wrong Pass Phrase!');
      return;
    }

    if (!formData.title || !formData.url) {
      toast.error('Title and URL are required!');
      return;
    }

    await submitWithRetry();
  };

  return (
    <div className='container'>
      <form onSubmit={handleSubmit}>
        <div className='form-group'>
          <label htmlFor='title'>Title *</label>
          <input
            type='text'
            id='title'
            name='title'
            value={formData.title}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className='form-group'>
          <label htmlFor='url'>URL *</label>
          <input
            type='url'
            id='url'
            name='url'
            value={formData.url}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className='form-group'>
          <label htmlFor='dateHappened'>Date Happened</label>
          <input
            type='datetime-local'
            id='dateHappened'
            name='dateHappened'
            value={formData.dateHappened.slice(0, 16)}
            onChange={handleInputChange}
          />
        </div>

        <div className='form-group'>
          <label htmlFor='content'>Content</label>
          <textarea
            id='content'
            name='content'
            value={formData.content}
            onChange={handleInputChange}
            rows={5}
          />
        </div>

        <div className='form-group'>
          <label htmlFor='autoTags'>Auto Tags (comma-separated)</label>
          <input
            type='text'
            id='autoTags'
            name='autoTags'
            value={formData.autoTags}
            onChange={handleInputChange}
          />
        </div>

        <div className='form-group'>
          <label htmlFor='quckComment'>Quick Comment</label>
          <textarea
            id='quckComment'
            name='quckComment'
            value={formData.quckComment}
            onChange={handleInputChange}
            rows={5}
          />
        </div>

        <div className='form-group'>
          <label htmlFor='tags'>Tags</label>
          <div className='tag-dropdown' ref={tagDropdownRef}>
            {formData.tags.map((tag) => {
              const result = availableTags.filter((item) => item.id === tag);
              return (
                <span key={tag} className='tag-item'>
                  {result && result.length && result[0].attributes.name}
                </span>
              );
            })}
            <span
              className='dropdown-arrow'
              onClick={() => setTagDropdownOpen(!tagDropdownOpen)}
            >
              {tagDropdownOpen ? '▲' : '▼'}
            </span>
            {tagDropdownOpen && (
              <ul className='tag-list'>
                {availableTags.map((tag) => (
                  <li
                    key={tag.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTagChange(tag.id);
                    }}
                  >
                    <input
                      type='checkbox'
                      checked={formData.tags.includes(tag.id)}
                      onChange={() => {}} // handled by the li click
                    />
                    {tag.attributes.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className='form-group'>
          <label htmlFor='passPhrase1'>Pass Phrase 1</label>
          <input
            type='password'
            id='passPhrase1'
            name='passPhrase1'
            value={formData.passPhrase1}
            onChange={handleInputChange}
          />
        </div>

        <div className='form-group'>
          <label htmlFor='passPhrase2'>Pass Phrase 2</label>
          <input
            type='password'
            id='passPhrase2'
            name='passPhrase2'
            value={formData.passPhrase2}
            onChange={handleInputChange}
          />
        </div>

        <button type='submit'>Submit</button>
      </form>

      <hr className='border-1 border-slate-400' />
      <TagAdd />

      <ToastContainer position='bottom-right' />
      <MatomoTracker siteId={siteId} matomoUrl={matomoUrl} />
    </div>
  );
};

export default App;
