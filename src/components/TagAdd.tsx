import React, { useState, useEffect, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const BASEURL =
  import.meta.env.VITE_STRAPI_ENDPOINT_CREATE || 'http://localhost:1337';
const STRAPI_TOKEN = import.meta.env.VITE_STRAPI_TOKEN || 'secret';

interface TagFormData {
  name: string;
  count: number;
  description: string;
  passPhrase1: string;
  passPhrase2: string;
}

interface Tag {
  id: number;
  attributes: {
    name: string;
  };
}

const TagAdd: React.FC = () => {
  const [formData, setFormData] = useState<TagFormData>({
    name: '',
    count: 0,
    description: '',
    passPhrase1: '',
    passPhrase2: '',
  });
  const [queryTag, setQueryTag] = useState<string>('');
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

  const tagDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch(`${BASEURL}/api/tags`);
        if (!response.ok) {
          throw new Error(`Failed to fetch tags: ${response.status}`);
        }
        const data = await response.json();
        setAvailableTags(data.data);
      } catch (error) {
        console.error('Error fetching tags:', error);
        toast.error('Failed to load tags.');
      }
    };

    fetchTags();
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

  const handleTagInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setQueryTag(e.target.value);
  };

  const submitWithRetry = async (retryCount = 0): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 seconds timeout

      const response = await fetch(`${BASEURL}/api/tags`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${formData.passPhrase1 + STRAPI_TOKEN + formData.passPhrase2}`,
        },
        body: JSON.stringify({
          data: {
            name: formData.name,
            count: formData.count,
            description: formData.description,
            publishedAt: new Date().toISOString(),
            locale: 'zh-Hant-HK',
          },
        }),
      });

      clearTimeout(timeoutId);

      if (response.status === 200) {
        const tagData = await response.json();
        const tagId = tagData.data.id;

        if (tagId) {
          toast.success(
            `Tag "${tagData.data.name}" (${tagId}) created successfully!`,
          );
          return true;
        } else {
          toast.error(`Failed to link tags: ${tagData.status}`);
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

    if (!formData.name) {
      toast.error('Name is required!');
      return;
    }

    await submitWithRetry();
  };

  return (
    <div className='container'>
      <form onSubmit={handleSubmit}>
        <div className='form-group'>
          <label htmlFor='name'>Tag name *</label>
          <input
            type='text'
            id='name'
            name='name'
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className='form-group'>
          <label htmlFor='description'>Description</label>
          <input
            type='description'
            id='description'
            name='description'
            value={formData.description}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className='form-group'>
          <label htmlFor='queryTag'>Query tag</label>
          <input
            type='queryTag'
            id='queryTag'
            name='queryTag'
            value={queryTag}
            onChange={handleTagInputChange}
          />
        </div>

        <div className='form-group'>
          <label htmlFor='tags'>Tags</label>
          <div className='tag-dropdown' ref={tagDropdownRef}>
            {availableTags
              .filter((item) => {
                return (
                  -1 !==
                  item.attributes.name
                    ?.toLowerCase()
                    .indexOf(queryTag.toLowerCase())
                );
              })
              .map((tag) => {
                return (
                  <span key={tag.id} className='tag-item'>
                    {tag && tag.id && tag.attributes.name}
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
                  <li key={tag.id}>{tag.attributes.name}</li>
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

        <button type='submit'>Submit tag</button>
      </form>
      <ToastContainer position='bottom-right' />
    </div>
  );
};

export default TagAdd;
