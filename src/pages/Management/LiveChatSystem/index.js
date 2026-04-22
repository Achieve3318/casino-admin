import React, { useCallback, useEffect, useRef, useState } from 'react';
import postUrl from '../../../utility/postUrl';
import { MessageOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import InfiniteScroll from "react-infinite-scroll-component";
import moment from 'moment';
import { Image, Input } from 'antd';
import { useAuth } from '../../../context/AuthContext';
import { SUB_SITE } from '../../../utility';

const LiveChatSystem = () => {
    const [orginGroup, setOriginGroup] = useState([])
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [messages, setMessages] = useState([]);
    const [visibleCount, setVisibleCount] = useState(20);
    const [search, setSearch] = useState('');
    const [hasMore, setHasMore] = useState(true);
    const [index, setIndex] = useState(0);
    const [isLoading, setLoading] = useState(false);

    const [hasMoreMessage, setHasMoreMessage] = useState(true);
    const [messageIndex, setMessageIndex] = useState(0);
    const [isLoadingMessage, setIsLoadingMessage] = useState(false);

    const {sitemode} = useAuth()

    const scrollRef = useRef(null);


    useEffect(() => {
        postUrl(sitemode,"/api/support/getChatUserList", { search, page: 0, pageSize: 20 }, (data) => {
            setOriginGroup(data);
            setIndex(1);
            if (data.length !== 20) setHasMore(false);
        });
    }, [search]);

    const fetchMoreData = useCallback(() => {
        if (isLoading) return;
        setLoading(true);
        postUrl(sitemode,"/api/support/getChatUserList", {
            search,
            page: index,
            pageSize: 20,
        }, (data) => {
            setOriginGroup([...orginGroup, ...data]);
            if (data.length !== 20) setHasMore(false);
            setLoading(false);
        });
        setIndex((idx) => idx + 1);
    }, [index, isLoading]);

    const fetchMoreMessage = useCallback(() => {
        if (isLoadingMessage) return;
        setIsLoadingMessage(true);
        postUrl(sitemode,"/api/support/getMessagesFromEmail", {
            ...selectedGroup,
            page: messageIndex,
            pageSize: 15,
        }, (data) => {
            setMessages([...messages, ...data]);
            if (data.length !== 15) setHasMoreMessage(false);
            setIsLoadingMessage(false);
        });
        setMessageIndex((idx) => idx + 1);
    }, [messageIndex, isLoadingMessage]);

    // useEffect(() => {
    //     setGroup(orginGroup.filter(each => (each.user.search(search) !== -1 || each.supporter.search(search) !== -1)))
    // }, [search, orginGroup])
    const color = (index) => {
        const colors = ['#FFCDD2', '#C8E6C9', '#FFEB3B', '#B3E5FC', '#FFCDD2', '#C8E6C9', '#FFEB3B', '#B3E5FC'];
        return colors[index % colors.length];
    }

    useEffect(() => {
        if (selectedGroup) {
            postUrl(sitemode,"/api/support/getMessagesFromEmail", { ...selectedGroup, page: 0, pageSize: 15 }, (data) => {
                setMessages(data);
                setMessageIndex(1);
                if (data.length !== 15) setHasMoreMessage(false);
            });
        }
    }, [selectedGroup]);
    return (
        <div className='flex  h-[calc(100vh-60px)] border-2 border-solid border-gray-200 '>
            <div className={`lg:w-[350px] w-full bg-[#ebf7ff] h-full py-3 px-2  ${selectedGroup ? "hidden" : 'block'} lg:block`}>
                <Input.Search placeholder="Search User or Supporter" onSearch={(e) => {
                    setSearch(e)

                }} />
                <InfiniteScroll
                    dataLength={orginGroup.length}
                    next={fetchMoreData}
                    hasMore={hasMore}
                    // loader={<p className="text-center text-gray-500">Loading ...</p>}
                    // endMessage={
                    //   <p className="text-center text-gray-500">No more records to show</p>
                    // }
                    scrollableTarget="scrollableDiv"
                >
                    <div id="scrollableDiv"
                        className={`flex-col h-[calc(100vh-100px)] overflow-y-auto mt-4`}>
                        {orginGroup.map((item, index) => (
                            <div key={item._id} className={`flex justify-between gap-2 p-2 hover:bg-sky-100 cursor-pointer ${(selectedGroup?.user === item.user && selectedGroup?.supporter === item.supporter) ? 'bg-sky-200' : ''}`} onClick={() => setSelectedGroup(item)}>
                                <div className='w-[30px] h-[30px] rounded-full flex items-center justify-center cursor-pointer' style={{ backgroundColor: color(index) }}>
                                    <MessageOutlined color='#000' />
                                </div>
                                <div className='flex flex-col w-[190px]'>
                                    <span className='font-bold text-wrap break-words'>{item.user}</span>
                                    <span className='text-xs text-gray-500 text-wrap break-words'>{item.supporter}</span>
                                </div>
                                <div className='flex items-center gap-2 w-[80px]'>
                                    <span className='text-xs text-gray-500'>{moment.utc(item.lastMessageAt).fromNow()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </InfiniteScroll>
            </div>
            {selectedGroup && <div className='w-full h-full'>
                <div className='w-full bg-[#f1f1f1] p-2'>
                    <div className='flex items-center gap-2 w-full justify-between'>
                        <div className='flex items-center gap-2'>
                            <div className='lg:hidden' onClick={() => {
                                setSelectedGroup(null)
                            }}><i className='fa fa-arrow-left' /></div>
                            <div className='w-10 h-10 rounded-full flex items-center justify-center cursor-pointer bg-red-300'>
                                <TeamOutlined color='#000' />
                            </div>
                            <span className='text-md font-bold'>{selectedGroup?.supporter}</span>
                        </div>
                        <div className='flex items-center gap-2'>
                            <div className='w-10 h-10 rounded-full flex items-center justify-center cursor-pointer bg-cyan-300'>
                                <UserOutlined color='#000' />
                            </div>
                            <span className='text-md font-bold'>{selectedGroup?.user}</span>
                        </div>
                    </div>
                </div>
                <InfiniteScroll
                    dataLength={messages.length}
                    next={fetchMoreMessage}
                    hasMore={hasMoreMessage}
                    // loader={<p className="text-center text-gray-500">Loading ...</p>}
                    // endMessage={
                    //   <p className="text-center text-gray-500">No more records to show</p>
                    // }
                    scrollableTarget="scrollableMessageDiv"
                >
                    <div id="scrollableMessageDiv"
                        className={`flex-col h-[calc(100vh-150px)] overflow-y-auto mt-4`}>
                        {messages.map((item, index) => (
                            <>
                                {item.isUser ? <div key={index} className='flex w-full justify-end items-end gap-2 p-2'>
                                    <div className='bg-cyan-100 p-2 rounded-md flex flex-col gap-1 max-w-[60%]'>
                                        {item.message &&
                                            item.message.startsWith('image/') ? (
                                            <Image
                                                src={SUB_SITE[sitemode]+ '/' + item.message.split('`')[1]}
                                                alt=""
                                                style={{
                                                    maxWidth: '200px',
                                                    maxHeight: '200px',
                                                    cursor: 'pointer',
                                                }}
                                            />
                                        ) : item.message &&
                                            item.message.startsWith('audio/') ? (
                                            <audio
                                                controls
                                                src={SUB_SITE[sitemode]+ '/' + item.message.split('`')[1]}
                                            ></audio>
                                        ) : item.message &&
                                            item.message.startsWith('video/') ? (
                                            <video
                                                controls
                                                src={SUB_SITE[sitemode]+ '/' + item.message.split('`')[1]}
                                                style={{
                                                    maxWidth: '200px',
                                                    maxHeight: '200px',
                                                    cursor: 'pointer',
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // setSelectedVideo(item.message.split('`')[1]);
                                                }}
                                            />
                                        ) : item.file ? (<div style={{ whiteSpace: 'pre-wrap' }} >
                                            <a href={`${SUB_SITE[sitemode]}/public/chat/${item.file.filename}`}>
                                                {
                                                    item.file.originalname
                                                }
                                            </a>
                                        </div>) : (
                                            <div style={{ whiteSpace: 'pre-wrap' }}>
                                                {item.message}
                                            </div>
                                        )}
                                        <span className='text-xs text-gray-500 text-right'>{moment.utc(item.lastMessageAt).format('DD/MM/YYYY HH:mm')}</span>
                                    </div>
                                    <div className='w-10 h-10 rounded-full flex items-center justify-center cursor-pointer bg-cyan-300'>
                                        <UserOutlined color='#000' />
                                    </div>
                                </div> : <div key={index} className='flex w-full justify-start items-end gap-2 p-2'>
                                    <div className='w-10 h-10 rounded-full flex items-center justify-center cursor-pointer bg-red-300'>
                                        <TeamOutlined color='#000' />
                                    </div>
                                    <div className='bg-red-100 p-2 rounded-md flex flex-col gap-1 max-w-[60%]'>
                                        {item.message &&
                                            item.message.startsWith('image/') ? (
                                            <Image
                                                src={SUB_SITE[sitemode] + '/' + item.message.split('`')[1]}
                                                alt=""
                                                style={{
                                                    maxWidth: '200px',
                                                    maxHeight: '200px',
                                                    cursor: 'pointer',
                                                }}
                                            />
                                        ) : item.message &&
                                            item.message.startsWith('audio/') ? (
                                            <audio
                                                controls
                                                src={SUB_SITE[sitemode] + '/' + item.message.split('`')[1]}
                                            ></audio>
                                        ) : item.message &&
                                            item.message.startsWith('video/') ? (
                                            <video
                                                controls
                                                src={SUB_SITE[sitemode] + '/' + item.message.split('`')[1]}
                                                style={{
                                                    maxWidth: '200px',
                                                    maxHeight: '200px',
                                                    cursor: 'pointer',
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // setSelectedVideo(item.message.split('`')[1]);
                                                }}
                                            />
                                        ) : item.file ? (<div style={{ whiteSpace: 'pre-wrap' }} >
                                            <a href={`${SUB_SITE[sitemode]}/public/chat/${item.file.filename}`}>
                                                {
                                                    item.file.originalname
                                                }
                                            </a>
                                        </div>) : (
                                            <div style={{ whiteSpace: 'pre-wrap' }}>
                                                {item.message}
                                            </div>
                                        )}
                                        <span className='text-xs text-gray-500 text-right'>{moment.utc(item.lastMessageAt).format('DD/MM/YYYY HH:mm')}</span>
                                    </div>
                                </div>}
                            </>
                        ))}
                    </div>
                </InfiniteScroll>
            </div>}
        </div>
    );
};

export default LiveChatSystem;
